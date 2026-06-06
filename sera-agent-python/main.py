import json
import os
import re
import time
import asyncio
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

import vertexai
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel
from google.genai import types
from agent_registry import get_runner, reset_session
from tools.sera_tools import generate_store_assets
from utils.logger import logger
from utils.cognition import (
    detect_context,
    emit_pre_run,
    emit_post_tool,
    emit_self_correction,
    emit_completion,
    infer_phase as cog_infer_phase,
)
from utils.intent import classify_intent
from utils.asset_store import ASSET_STORE

# Initialize FastAPI App
app = FastAPI(title="SERA Multi-Agent Service")

assets_dir = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(assets_dir, exist_ok=True)
app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Vertex AI SDK
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "sera-495721")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
logger.info(f"🚀 Initializing Vertex AI with project={PROJECT_ID}, location={LOCATION}")
vertexai.init(project=PROJECT_ID, location=LOCATION)

class ChatRequest(BaseModel):
    input: str
    history: List[Dict[str, Any]]
    storeContext: Optional[Dict[str, Any]] = None
    chatMode: Optional[str] = "agent"
    images: Optional[List[str]] = []
    contextScope: Optional[str] = "marketplace"
    activeStoreId: Optional[str] = None
    activeProductId: Optional[str] = None

class RetryAssetsRequest(BaseModel):
    schema_data: Dict[str, Any]
    failed_item_ids: List[str]

class EmbedRequest(BaseModel):
    text: str

# ── Self-introduction suppression ──────────────────────────────────────────
SELF_INTRO_RE = re.compile(
    r"(I\s+am\s+(Gemini|a\s+large\s+language\s+model|an?\s+AI|SERA|a\s+language\s+model|an?\s+AI\s+(?:assistant|model))"
    r"|As\s+(?:an?\s+)?(?:AI|language\s+model|Gemini|SERA)"
    r"|I'm\s+(?:Gemini|an?\s+AI|a\s+language\s+model|SERA)"
    r"|(?:Hello|Hi)[,!]?\s+I(?:'m|\s+am)"
    r"|I(?:'d|\s+would)\s+be\s+(?:happy|glad|pleased)\s+to"
    r"|Certainly[,!]?\s*"
    r"|Of\s+course[,!]?\s*"
    r"|Sure[,!]?\s+I"
    r"|Absolutely[,!]?\s*)",
    re.IGNORECASE
)

def filter_self_intro(text: str) -> str:
    """Remove AI self-introduction phrases from agent output."""
    if not text:
        return text
    # Remove lines that are purely self-intro
    lines = text.split("\n")
    filtered = []
    for line in lines:
        stripped = line.strip()
        # Skip lines that start with or are entirely a self-intro pattern
        if stripped and SELF_INTRO_RE.match(stripped):
            continue
        filtered.append(line)
    result = "\n".join(filtered)
    # Also inline-replace remaining matches
    result = SELF_INTRO_RE.sub("", result)
    return result.strip()

# ── Dynamic phase inference ──────────────────────────────────────────────────
PHASE_KEYWORDS = [
    ("brand_strategy",     ["brand", "positioning", "identity", "concept", "strategy"]),
    ("catalog_design",     ["catalog", "product", "inventory", "sku", "pricing", "curating"]),
    ("layout_design",      ["layout", "section", "hero", "structure", "schema", "design"]),
    ("asset_generation",   ["image", "asset", "photo", "visual", "imagen", "generating"]),
    ("quality_check",      ["check", "verif", "review", "audit", "inspect", "conflict"]),
    ("campaign_design",    ["campaign", "promo", "marketing", "discount", "flash"]),
    ("data_fetching",      ["fetching", "querying", "store", "existing", "mongodb"]),
    ("analysis",           ["analyz", "intent", "request", "understand", "orchestrat"]),
]

def infer_phase(message: str) -> str:
    """Dynamically infer execution phase from cognition message content."""
    msg_lower = (message or "").lower()
    for phase, keywords in PHASE_KEYWORDS:
        if any(kw in msg_lower for kw in keywords):
            return phase
    return "thinking"

def determine_agent_type(user_input: str, chat_mode: str, active_tab: str = None) -> str:
    import re
    input_lower = user_input.lower()
    if chat_mode == "buyer":
        return "buyer_agent"
        
    if active_tab == "analytics":
        return "analytics_agent"
        
    words = set(re.findall(r'\b\w+\b', input_lower))
    
    store_edit_kws = {"ganti", "mengganti", "ubah", "mengubah", "tambah", "menambah", "hapus", "menghapus", "image", "gambar", "layout", "warna", "tulisan", "teks", "judul", "buat", "membuat", "bikin", "change", "update", "replace", "edit", "modify", "remove"}
    
    analytics_kws = {"analytics", "analisis", "analisa", "visitor", "sales", "revenue", "conversion", "performa", "perfoma", "performance", "pengunjung", "penjualan", "laporan", "metrik", "metric", "data", "statistik", "stat", "trend"}
    if words.intersection(analytics_kws) and not words.intersection(store_edit_kws):
        return "analytics_agent"
        
    veo_kws = {"video", "veo", "cinematic", "generate video", "mp4"}
    if words.intersection(veo_kws):
        return "veo_agent"
        
    marketing_kws = {"campaign", "marketing", "promo", "diskon", "discount", "iklan", "ad", "ads", "promosi"}
    if words.intersection(marketing_kws):
        return "marketing_agent"
        
    return "store_agent"

@app.post("/api/agent/retry-assets")
async def retry_assets(request: RetryAssetsRequest):
    logger.info(f"🔄 Received retry-assets request for items: {request.failed_item_ids}")
    
    schema = request.schema_data
    failed_ids = set(request.failed_item_ids)
    
    # Strip URL from failed items to force regeneration
    for section in schema.get("layout", []):
        if section.get("type") == "hero" and "hero_bg" in failed_ids:
            if "props" in section and "heroImage" in section["props"]:
                section["props"].pop("heroImage")
                
        if section.get("type") == "featured_products":
            for prod in section.get("props", {}).get("products", []):
                if prod.get("id") in failed_ids:
                    prod.pop("verifiedUrl", None)
                    prod.pop("imageUrl", None)
                    prod.pop("pendingUrl", None)
                    
        if section.get("type") == "philosophy":
            for item in section.get("props", {}).get("items", []):
                if item.get("id") in failed_ids:
                    item.pop("verifiedUrl", None)
                    item.pop("imageUrl", None)
                    item.pop("pendingUrl", None)

    async def response_generator():
        progress_queue = asyncio.Queue()
        
        async def run_gen_task():
            try:
                await emit_pre_run(progress_queue, "Initiating safety self-correction for failed assets...")
                schema_result = await generate_store_assets(schema, progress_queue)
                yield_data = json.dumps({"type": "execution_state", "state": {"results": schema_result.get("results", [])}}) + "\n"
                await progress_queue.put(yield_data)
                await emit_completion(progress_queue, "All failed assets have been successfully regenerated.")
            except Exception as e:
                logger.error(f"Error in retry_assets task: {e}")
                await emit_completion(progress_queue, "Failed to regenerate assets.")
            finally:
                await progress_queue.put(None)
                
        asyncio.create_task(run_gen_task())
        
        while True:
            msg = await progress_queue.get()
            if msg is None:
                break
            if isinstance(msg, str):
                yield msg
            else:
                yield json.dumps(msg) + "\n"
                
    return StreamingResponse(response_generator(), media_type="text/event-stream")

@app.post("/api/agent/chat")
async def chat_with_agent(request: ChatRequest):
    logger.info(f"📩 Received chat request for chatMode={request.chatMode}")
    
    active_tab = request.storeContext.get("activeTab") if request.storeContext else None
    
    # 1. Routing: select agent runner
    agent_type = determine_agent_type(request.input, request.chatMode or "agent", active_tab)
    runner = get_runner(agent_type)
    
    # Session identifier
    session_id = request.storeContext.get("session_id", "guest_default") if request.storeContext else "guest_default"
    user_id = "sera_user"
    
    async def run_execution_pipeline(start_time, session_id, agent_type, runner, user_id):
        ctx = detect_context(request.input)
        
        # ── Phase 1: Pre-run contextual cognition (EXECUTION MODE ONLY) ────────
        # removed emit_pre_run
        
        # Build prompt — strip heavy payload fields to avoid token overflow
        context_str = ""
        if request.chatMode == "buyer":
            buyer_ctx = {
                "contextScope": request.contextScope,
                "activeStoreId": request.activeStoreId,
                "activeProductId": request.activeProductId
            }
            context_str = f"\n\nContext Location: {json.dumps(buyer_ctx)}"
        elif request.storeContext:
            safe_ctx = {}
            SAFE_KEYS = {"session_id", "title", "themeColor", "heroBg", "storeName", "storeId", "chatMode", "activeStores", "activeTab"}
            for k, v in request.storeContext.items():
                if k in SAFE_KEYS: safe_ctx[k] = v
                elif k == "products" and isinstance(v, list):
                    # Strip heavy image URLs from products to avoid token overflow
                    safe_ctx["products"] = [
                        {pk: pv for pk, pv in p.items() if pk not in ["imageUrl", "pendingUrl", "verifiedUrl", "imagePrompt"]}
                        for p in v
                    ]
                elif isinstance(v, str) and len(v) < 200: safe_ctx[k] = v
            if safe_ctx: context_str = f"\n\nStore Context: {json.dumps(safe_ctx)}"

        # Append recent history to input
        history_str = ""
        if request.history:
            # take last 4 messages to avoid token bloat
            recent = request.history[-4:]
            for msg in recent:
                role = "User" if msg.get("role") == "user" else "Agent"
                text = msg.get("text", "")
                history_str += f"{role}: {text}\n"
        
        if history_str:
            rich_input = f"Previous Conversation:\n{history_str}\n\nCurrent Request: {request.input}{context_str}"
        else:
            rich_input = f"{request.input}{context_str}"
            
        new_msg = types.Content(role="user", parts=[types.Part.from_text(text=rich_input)])
        
        final_text = ""
        tool_calls_made = []
        messages_texts = {}

        await reset_session(agent_type, user_id, session_id)

        try:
            # ── Phase 2: ADK agent execution ─────────────────────────────────
            async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=new_msg):
                if event.author != "user":
                    if event.content and event.content.parts:
                        current_text = ""
                        for part in event.content.parts:
                            if part.text:
                                current_text += part.text
                                
                        print(f"DEBUG EVENT {event.id}: parts={len(event.content.parts)} text_len={len(current_text)}")
                        
                        messages_texts[event.id] = current_text
                        
                        clean = filter_self_intro(current_text)
                        
                        # Strip bulleted thought process only for seller agent
                        if request.chatMode != 'buyer':
                            chat_bubble_text = re.sub(r'^- .*\n?', '', clean, flags=re.MULTILINE).strip()
                        else:
                            chat_bubble_text = clean.strip()
                        if clean:
                            # 1. Emit ephemeral text so the user sees the real-time typing effect (clean version)
                            yield json.dumps({
                                "event_id": f"evt_{event.id}",
                                "timestamp": int(event.timestamp) if event.timestamp else int(time.time()),
                                "session_id": session_id,
                                "type": "agent_message_start",
                                "agent": event.author,
                                "text": chat_bubble_text,
                                "ephemeral": True,
                            }) + "\n"
                            
                            # 2. Emit cognition bullet points for the dropdown log
                            if request.chatMode != 'buyer':
                                pre_json_text = clean.split('```')[0].strip()
                                if not pre_json_text: pre_json_text = clean.split('{')[0].strip()
                                
                                lines = pre_json_text.split('\n')
                                for i, line in enumerate(lines):
                                    line = line.strip()
                                    if not line: continue
                                    
                                    if line.startswith('- ') or line.startswith('* '):
                                        cognition_msg = line[2:]
                                        yield json.dumps({
                                            "event_id": f"evt_{event.id}_line_{i}",
                                            "timestamp": int(event.timestamp) if event.timestamp else int(time.time()),
                                            "session_id": session_id,
                                            "type": "cognition",
                                            "agent": event.author,
                                            "message": cognition_msg,
                                            "phase": infer_phase(cognition_msg),
                                            "done": True
                                        }) + "\n"

                    func_calls = event.get_function_calls()
                    for fc in func_calls:
                        tool_calls_made.append(fc.name)
                        tool_msg = f"Executing {fc.name}..."
                        yield json.dumps({
                            "event_id": f"evt_{event.id}_{fc.name}",
                            "timestamp": int(event.timestamp) if event.timestamp else int(time.time()),
                            "session_id": session_id,
                            "type": "cognition",
                            "agent": event.author,
                            "tool": fc.name,
                            "message": tool_msg,
                            "phase": "execution",
                        }) + "\n"

                    func_responses = event.get_function_responses()
                    for fr in func_responses:
                        pass # removed emit_post_tool and self_correction

        except Exception as e:
            logger.error(f"Error during ADK run: {str(e)}")
            yield json.dumps({
                "event_id": f"evt_err_{int(time.time())}",
                "timestamp": int(time.time()),
                "session_id": session_id,
                "type": "agent_message_start",
                "text": f"Runtime error: {str(e)[:200]}",
                "ephemeral": False,
            }) + "\n"
            
        action = "idle"
        params = {}
        
        # Combine the text from the last assistant message
        final_text = list(messages_texts.values())[-1].strip() if messages_texts else ""
        
        # Strip bulleted thought process from the final text
        if request.chatMode != 'buyer':
            final_text = re.sub(r'^- .*\n?', '', final_text, flags=re.MULTILINE).strip()
        
        text_out = final_text
        chat_out = ""
        summary = None

        def extract_json_from_text(text: str):
            fence = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
            if fence: return fence.group(1)
            matches = list(re.finditer(r"\{", text))
            for m in matches:
                candidate = text[m.start():]
                depth = 0
                for i, ch in enumerate(candidate):
                    if ch == "{": depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            fragment = candidate[:i+1]
                            if '"action"' in fragment: return fragment
            return None

        raw_json = extract_json_from_text(final_text)
        logger.info(f"RAW JSON MATCH: {raw_json}")
        if raw_json:
            pre_json = final_text.split("```")[0].strip()
            if not pre_json:
                pre_json = final_text.split("{")[0].strip()
                
            if pre_json:
                pass # removed duplicate preamble yield
                
            try:
                data = json.loads(raw_json)
                logger.info(f"DEBUG LLM DATA (Raw): {data}")
                
                # --- Layer 1 & 2: Intent Firewall & RBAC ---
                ALLOWED_ACTIONS = {
                    "buyer": {"idle", "search_products", "view_product", "ask_question", "browse_store"},
                    "seller": {"*"},
                    "agent": {"*"},
                    "plan": {"*"}
                }
                SAFE_KEYS = {"action", "chat", "text", "params"}
                
                # 1. Schema Sanitization
                sanitized_data = {k: v for k, v in data.items() if k in SAFE_KEYS}
                
                # 2. RBAC Validation
                attempted_action = sanitized_data.get("action", "idle")
                role = request.chatMode or "buyer"
                allowed_for_role = ALLOWED_ACTIONS.get(role, set())
                
                if "*" not in allowed_for_role and attempted_action not in allowed_for_role:
                    logger.warning(f"Role '{role}' attempted unauthorized action: {attempted_action}. Blocking.")
                    action = "idle"
                    params = {}
                    chat_out = f"Sorry, the action '{attempted_action}' is not permitted in {role.capitalize()} mode."
                    text_out = "Unauthorized action blocked."
                else:
                    action = attempted_action
                    params = sanitized_data.get("params", {})
                    chat_out = sanitized_data.get("chat", "")
                    text_out = sanitized_data.get("text", "Execution completed.")
                    logger.info(f"DEBUG LLM DATA (Sanitized): {sanitized_data}")

            except Exception:
                pass

        if agent_type in ["store_agent", "marketing_agent"] and (action in ["batch_create", "update_schema", "update_philosophy"]):
            schema = params.get("schema", {}) or params
            if "layout" not in schema: schema["layout"] = []
            
            if action == "update_philosophy" and "items" in params:
                schema["layout"].append({
                    "id": "philo_injected",
                    "type": "philosophy",
                    "variant": "scroller",
                    "props": {"items": params["items"]}
                })
            elif "philosophy" in params and not any(s.get("type") == "philosophy" for s in schema["layout"]):
                schema["layout"].append({
                    "id": "philo_injected",
                    "type": "philosophy",
                    "variant": "scroller",
                    "props": {"items": params.get("philosophy", [])}
                })
            
            if "products" in params:
                prod_sec = next((s for s in schema["layout"] if s.get("type") == "featured_products"), None)
                if prod_sec:
                    if "props" not in prod_sec: prod_sec["props"] = {}
                    prod_sec["props"]["products"] = params.get("products", [])
                else:
                    schema["layout"].append({
                        "id": "prods_injected",
                        "type": "featured_products",
                        "variant": "grid",
                        "props": {"products": params.get("products", [])}
                    })
            
            layout = schema.get("layout", [])
            needs_gen = False
            for sec in layout:
                st = sec.get("type")
                props = sec.get("props", {})
                if st == "hero" and props.get("heroImagePrompt") and (not props.get("heroImage") or "unsplash.com" in str(props.get("heroImage", ""))): needs_gen = True
                elif st == "featured_products":
                    for p in props.get("products", []):
                        if not p.get("verifiedUrl") and (not p.get("imageUrl") or "unsplash.com" in str(p.get("imageUrl", ""))): needs_gen = True
                elif st == "philosophy":
                    for item in props.get("items", []):
                        if not item.get("verifiedUrl") and (not item.get("imageUrl") or "unsplash.com" in str(item.get("imageUrl", ""))): needs_gen = True
                            
            if needs_gen:
                yield json.dumps({
                    "event_id": f"evt_fallback_cognition_{int(time.time())}",
                    "timestamp": int(time.time()),
                    "session_id": session_id,
                    "type": "cognition",
                    "message": "Generating missing high-fidelity storefront assets via Imagen 3...",
                    "phase": "asset_generation"
                }) + "\n"
                
                yield json.dumps({
                    "event_id": f"evt_fallback_preview_{int(time.time())}",
                    "timestamp": int(time.time()),
                    "session_id": session_id,
                    "type": "schema_preview",
                    "action": action,
                    "params": params
                }) + "\n"
                
                try:
                    q = asyncio.Queue()
                    
                    async def run_gen_task():
                        try:
                            result = await generate_store_assets(schema, q)
                            await q.put({"done": True, "res": result})
                        except Exception as ex:
                            logger.error(f"Generate assets task failed: {ex}")
                            await q.put({"done": True, "res": {"success": False, "error": str(ex)}})
                            
                    asyncio.create_task(run_gen_task())
                    
                    res = None
                    while True:
                        msg = await q.get()
                        if msg.get("done"):
                            res = msg["res"]
                            break
                            
                        yield json.dumps({
                            "event_id": f"evt_fallback_execution_{int(time.time())}_{len(msg['results'])}",
                            "timestamp": int(time.time()),
                            "session_id": session_id,
                            "type": "execution_state",
                            "state": {
                                "task_id": f"task_{int(time.time())}",
                                "results": msg["results"]
                            }
                        }) + "\n"

                    if res.get("success"):
                        results = res.get("results", [])
                        
                        # --- SELF-CORRECTION LOOP ---
                        max_retries = 3
                        attempt = 0
                        while attempt < max_retries:
                            failed_items = [r for r in results if r.get("status") == "failed"]
                            if not failed_items:
                                break
                            
                            # The user sees the retry notification
                            yield json.dumps({
                                "event_id": f"evt_fallback_correction_{int(time.time())}_{attempt}",
                                "timestamp": int(time.time()),
                                "session_id": session_id,
                                "type": "cognition",
                                "message": f"Detected {len(failed_items)} failed assets (safety filter/timeout). Initiating self-correction (Attempt {attempt+1}/{max_retries})...",
                                "phase": "quality_check",
                                "done": False
                            }) + "\n"
                            
                            yield json.dumps({
                                "event_id": f"evt_fallback_correction_2_{int(time.time())}_{attempt}",
                                "timestamp": int(time.time()),
                                "session_id": session_id,
                                "type": "cognition",
                                "message": "Retrying failed asset generation...",
                                "phase": "asset_generation",
                                "done": False
                            }) + "\n"
                            
                            # Clear URLs for failed items to force regeneration with the SAME prompt
                            for sec in schema.get("layout", []):
                                st = sec.get("type")
                                props = sec.get("props", {})
                                if st == "hero":
                                    pass # hero image URL is usually cleared automatically
                                elif st == "featured_products":
                                    for idx, p in enumerate(props.get("products", [])):
                                        if any(f.get("itemId") == f"prod_{idx}" for f in failed_items):
                                            p["verifiedUrl"] = ""
                                            p["imageUrl"] = ""
                                elif st == "philosophy":
                                    for idx, item in enumerate(props.get("items", [])):
                                        if any(f.get("itemId") == f"philo_{idx}" for f in failed_items):
                                            item["verifiedUrl"] = ""
                                            item["imageUrl"] = ""
                                            
                            # Re-run only the modified (missing) assets
                            q_retry = asyncio.Queue()
                            async def run_retry_task():
                                try:
                                    retry_res = await generate_store_assets(schema, q_retry)
                                    await q_retry.put({"done": True, "res": retry_res})
                                except Exception as ex:
                                    await q_retry.put({"done": True, "res": {"success": False}})
                            
                            asyncio.create_task(run_retry_task())
                            
                            retry_res = None
                            while True:
                                r_msg = await q_retry.get()
                                if r_msg.get("done"):
                                    retry_res = r_msg["res"]
                                    break
                                
                                yield json.dumps({
                                    "event_id": f"evt_fallback_execution_retry_{int(time.time())}_{attempt}",
                                    "timestamp": int(time.time()),
                                    "session_id": session_id,
                                    "type": "execution_state",
                                    "state": {
                                        "task_id": f"task_retry_{int(time.time())}",
                                        "results": r_msg.get("results", [])
                                    }
                                }) + "\n"

                            if retry_res and retry_res.get("success"):
                                retry_results = retry_res.get("results", [])
                                # Merge successful retries
                                for rr in retry_results:
                                    if rr.get("status") == "success":
                                        for i, old_r in enumerate(results):
                                            if old_r.get("itemId") == rr.get("itemId"):
                                                results[i] = rr
                                                break
                                                
                            attempt += 1
                        # --- END SELF-CORRECTION LOOP ---

                        params["schema"] = res.get("schema")
                        if action == "update_philosophy":
                            for sec in params["schema"].get("layout", []):
                                if sec.get("type") == "philosophy":
                                    params["items"] = sec.get("props", {}).get("items", [])
                                    break
                                    
                        yield json.dumps({
                            "event_id": f"evt_fallback_execution_final_{int(time.time())}",
                            "timestamp": int(time.time()),
                            "session_id": session_id,
                            "type": "execution_state",
                            "state": {
                                "task_id": f"task_final_{int(time.time())}",
                                "results": results
                            }
                        }) + "\n"
                except Exception as e:
                    logger.error(f"Asset generation error: {str(e)}")
                    
        # ── Phase 3: Completion cognition ─────────────────────────────────────
        # removed emit_completion

        latency = time.time() - start_time
        logger.info(f"🏁 Generation finished in {latency:.2f}s | action={action}")

        # Recursively replace asset IDs in params with actual base64 strings
        def restore_assets(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, str) and v in ASSET_STORE:
                        obj[k] = ASSET_STORE[v]
                    elif isinstance(v, (dict, list)):
                        restore_assets(v)
            elif isinstance(obj, list):
                for i, v in enumerate(obj):
                    if isinstance(v, str) and v in ASSET_STORE:
                        obj[i] = ASSET_STORE[v]
                    elif isinstance(v, (dict, list)):
                        restore_assets(v)
        restore_assets(params)

        yield json.dumps({
            "event_id": f"evt_final_{int(time.time())}",
            "timestamp": int(time.time()),
            "session_id": session_id,
            "type": "final",
            "agent": agent_type,
            "action": action,
            "params": params,
            "text": text_out,
            "chat": chat_out,
            "summary": summary
        }) + "\n"

    async def response_generator():
        start_time = time.time()
        active_tab = request.storeContext.get("activeTab") if request.storeContext else None
        intent_mode = "EXECUTION" if request.chatMode == "buyer" or active_tab == "analytics" else await classify_intent(request.input)
        display_intent = "CONSULTATION" if request.chatMode == "buyer" else intent_mode
        logger.info(f"🧠 Detected Intent Mode: {display_intent}")
        
        action = "idle"
        params = {}

        if intent_mode == "CONVERSATIONAL_GREETING":
            final_text = "Hey — what would you like to build today?"
            yield json.dumps({
                "event_id": f"evt_final_{int(time.time())}",
                "timestamp": int(time.time()),
                "session_id": session_id,
                "type": "final",
                "action": action,
                "params": params,
                "text": final_text,
            }) + "\n"
            return
            
        elif intent_mode == "CONVERSATIONAL_THANKS":
            final_text = "You're welcome! Let me know if there is anything else I can optimize for you."
            yield json.dumps({
                "event_id": f"evt_final_{int(time.time())}",
                "timestamp": int(time.time()),
                "session_id": session_id,
                "type": "final",
                "action": action,
                "params": params,
                "text": final_text,
            }) + "\n"
            return
            
            yield json.dumps({
                "event_id": f"evt_final_{int(time.time())}",
                "timestamp": int(time.time()),
                "session_id": session_id,
                "type": "final",
                "action": action,
                "params": params,
                "text": final_text,
            }) + "\n"
            return
            
        elif intent_mode == "CONVERSATIONAL_IDENTITY":
            final_text = "I am SERA, an autonomous AI operating system designed for premium commerce creation. What would you like to build?"
            yield json.dumps({
                "event_id": f"evt_final_{int(time.time())}",
                "timestamp": int(time.time()),
                "session_id": session_id,
                "type": "final",
                "action": action,
                "params": params,
                "text": final_text,
            }) + "\n"
            return
            
        elif "CONVERSATIONAL" in intent_mode:
            # FAST PATH: LLM inference for casual chat. No orchestration.
            prompt = f"You are SERA, a highly intelligent and premium AI operating system for autonomous commerce. The user said: '{request.input}'. Respond directly, concisely, and naturally. Do NOT introduce yourself or say 'I am an AI' unless they explicitly ask who you are. If they greet you, greet back warmly but keep the autonomous persona (e.g. 'Hey — what would you like to build today?')."
            from vertexai.generative_models import GenerativeModel
            model = GenerativeModel("gemini-2.5-flash")
            resp = model.generate_content(prompt)
            final_text = resp.text.strip() if resp.text else "Hello! I am ready to operate."
            
            yield json.dumps({
                "event_id": f"evt_final_{int(time.time())}",
                "timestamp": int(time.time()),
                "session_id": session_id,
                "type": "final",
                "action": action,
                "params": params,
                "text": final_text,
            }) + "\n"
            return
            
        elif intent_mode == "REASONING":
            # REASONING PATH: Strategic discussion. No tool executions or cognition phases.
            prompt = f"You are SERA, a highly intelligent AI operating system for autonomous commerce. The user is asking a strategic/conceptual question: '{request.input}'. Provide a concise, expert-level strategic reasoning response without full markdown blocks or code."
            from vertexai.generative_models import GenerativeModel
            model = GenerativeModel("gemini-2.5-flash")
            resp = model.generate_content(prompt)
            final_text = resp.text.strip() if resp.text else "Reasoning module completed."
            
            yield json.dumps({
                "event_id": f"evt_final_{int(time.time())}",
                "timestamp": int(time.time()),
                "session_id": session_id,
                "type": "final",
                "action": action,
                "params": params,
                "text": final_text,
            }) + "\n"
            return

        # STRICT ISOLATION: Only EXECUTION mode proceeds to CognitionEngine
        if intent_mode == "EXECUTION":
            async for chunk in run_execution_pipeline(start_time, session_id, agent_type, runner, user_id):
                yield chunk
            return
            
        # Mandatory Guard Fallback: If intent is unknown, fallback to conversational
        logger.warning(f"Unknown intent {intent_mode}. Defaulting to conversational fallback.")
        yield json.dumps({
            "event_id": f"evt_final_{int(time.time())}",
            "timestamp": int(time.time()),
            "session_id": session_id,
            "type": "final",
            "action": action,
            "params": params,
            "text": "I am SERA. How can I help you?",
        }) + "\n"
        return

    return StreamingResponse(response_generator(), media_type="application/x-ndjson")

@app.post("/api/agent/embed")
async def embed_text(request: EmbedRequest):
    logger.info(f"📊 Received embedding request for text length={len(request.text)}")
    try:
        model = TextEmbeddingModel.from_pretrained("text-embedding-004")
        text_input = TextEmbeddingInput(text=request.text, task_type="RETRIEVAL_QUERY")
        embeddings = model.get_embeddings([text_input])
        return {"success": True, "embedding": embeddings[0].values}
    except Exception as e:
        logger.error(f"Error generating embedding in Python: {str(e)}")
        # Fallback to zero-vector
        return {"success": False, "error": str(e), "embedding": [0.0] * 768}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
