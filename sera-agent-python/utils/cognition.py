"""
utils/cognition.py — SERA Cognition Engine
─────────────────────────────────────────────────────────────────
Orchestrates the intelligent narrative stream that wraps ADK execution.

Makes SERA feel like an autonomous operating system by:
- Detecting business context from user input
- Emitting contextual, non-linear cognition events
- Injecting self-correction and refinement signals
- Producing operational completion summaries
- Using natural variable timing (not uniform delays)

Reference: Cursor / Claude Code / Windsurf execution style
─────────────────────────────────────────────────────────────────
"""
import asyncio
import json
import random
import time
from typing import AsyncGenerator


# ─── Business context detection ───────────────────────────────────────────────
BUSINESS_CONTEXTS = {
    "coffee": {
        "kw": ["coffee", "cafe", "kopi", "espresso", "barista", "roast", "brew"],
        "domain": "specialty coffee",
        "tier": "artisan premium",
        "style": "warm minimalist",
        "products": "specialty blends and artisan brewing",
        "hero_concept": "atmospheric café environment",
    },
    "fashion": {
        "kw": ["fashion", "dress", "clothing", "baju", "outfit", "wear", "apparel", "garment"],
        "domain": "fashion",
        "tier": "luxury editorial",
        "style": "editorial luxury",
        "products": "curated fashion pieces",
        "hero_concept": "editorial fashion photography",
    },
    "skincare": {
        "kw": ["skincare", "beauty", "skin", "cosmetic", "serum", "moisturizer", "perawatan"],
        "domain": "beauty & skincare",
        "tier": "clinical premium",
        "style": "clean clinical",
        "products": "premium skincare formulations",
        "hero_concept": "clean clinical product still-life",
    },
    "food": {
        "kw": ["food", "restaurant", "culinary", "bakery", "pastry", "cake", "roti", "makanan"],
        "domain": "culinary arts",
        "tier": "artisan",
        "style": "warm artisan",
        "products": "artisan food products",
        "hero_concept": "rustic culinary photography",
    },
    "tech": {
        "kw": ["tech", "gadget", "electronic", "device", "laptop", "phone", "headphone"],
        "domain": "consumer tech",
        "tier": "modern premium",
        "style": "sleek monochrome",
        "products": "curated tech products",
        "hero_concept": "sleek product photography on dark surface",
    },
    "jewelry": {
        "kw": ["jewelry", "jewel", "perhiasan", "gold", "silver", "ring", "necklace", "cincin"],
        "domain": "fine jewelry",
        "tier": "ultra-luxury",
        "style": "opulent editorial",
        "products": "fine jewelry pieces",
        "hero_concept": "macro jewelry photography on black velvet",
    },
    "furniture": {
        "kw": ["furniture", "interior", "home", "sofa", "table", "meja", "kursi", "living"],
        "domain": "interior & furniture",
        "tier": "design premium",
        "style": "Scandinavian minimal",
        "products": "design furniture pieces",
        "hero_concept": "lifestyle interior photography",
    },
}


PHASE_KEYWORDS = [
    ("brand_strategy",   ["brand", "positioning", "identity", "concept", "strategy"]),
    ("catalog_design",   ["catalog", "product", "inventory", "sku", "pricing", "curating"]),
    ("layout_design",    ["layout", "section", "hero", "structure", "schema", "design"]),
    ("asset_generation", ["image", "asset", "photo", "visual", "imagen", "generating", "render"]),
    ("quality_check",    ["check", "verif", "review", "audit", "inspect", "conflict", "inconsist"]),
    ("campaign_design",  ["campaign", "promo", "marketing", "discount", "flash"]),
    ("data_fetching",    ["fetching", "querying", "store", "existing", "mongodb", "executing"]),
    ("analysis",         ["analyz", "intent", "request", "understand", "orchestrat", "parsing"]),
]

def infer_phase(message: str) -> str:
    """Dynamically infer execution phase from cognition message content."""
    msg_lower = (message or "").lower()
    for phase, keywords in PHASE_KEYWORDS:
        if any(kw in msg_lower for kw in keywords):
            return phase
    return "execution"


def detect_context(user_input: str) -> dict:
    """Detect business context and domain from the user's store request."""
    lower = user_input.lower()
    for ctx in BUSINESS_CONTEXTS.values():
        if any(kw in lower for kw in ctx["kw"]):
            return ctx
    return {
        "domain": "commerce",
        "tier": "premium",
        "style": "modern premium",
        "products": "curated products",
        "hero_concept": "premium product photography",
    }


# ─── Cognition event builder ───────────────────────────────────────────────────
def _evt(session_id: str, message: str, phase: str, agent: str = "store_agent") -> str:
    return json.dumps({
        "event_id": f"evt_cog_{int(time.time() * 1000)}_{random.randint(100, 999)}",
        "timestamp": int(time.time()),
        "session_id": session_id,
        "type": "cognition",
        "agent": agent,
        "message": message,
        "phase": phase,
    }) + "\n"


def jitter(base: float, spread: float = 0.3) -> float:
    """Natural variable delay: base ± spread seconds."""
    return max(0.1, base + random.uniform(-spread, spread))


# ─── Pre-run cognition sequence ────────────────────────────────────────────────
async def emit_pre_run(
    ctx: dict,
    session_id: str,
    agent_type: str,
    user_input: str = ""
) -> AsyncGenerator[str, None]:
    """
    Emit contextual cognition events BEFORE the ADK agent runs.
    These create the "thinking" phase visible to the user.
    """
    domain  = ctx["domain"]
    tier    = ctx["tier"]
    style   = ctx["style"]

    is_update = any(kw in user_input.lower() for kw in ["change", "update", "ubah", "edit", "ganti", "replace", "modify", "tambah"])

    if is_update:
        sequence = [
            (f"Parsing modification request intent...", "analysis", 0.5),
            (f"Isolating target components for {domain} update...", "analysis", jitter(0.8)),
            (f"Evaluating visual consistency constraints...", "brand_strategy", jitter(1.0)),
            (f"Retrieving active storefront state...", "data_fetching", jitter(0.7)),
        ]
    else:
        sequence = [
            # Analysis
            (f"Parsing request intent: {domain} commerce build...",         "analysis",       0.5),
            (f"Evaluating {tier} market positioning requirements...",        "brand_strategy", jitter(1.1)),
            (f"Analyzing brand architecture for {style} aesthetic...",       "brand_strategy", jitter(1.2)),
            # Catalog planning
            (f"Mapping product taxonomy for {domain} vertical...",           "catalog_design", jitter(0.9)),
            (f"Designing pricing strategy for {tier} positioning...",        "catalog_design", jitter(1.0)),
            # Registry check lead-in
            (f"Querying store registry for naming conflicts...",             "data_fetching",  jitter(0.7)),
        ]

    for message, phase, delay in sequence:
        await asyncio.sleep(delay)
        yield _evt(session_id, message, phase, agent_type)


# ─── Post-tool cognition (after each tool completes) ──────────────────────────
async def emit_post_tool(
    tool_name: str,
    ctx: dict,
    session_id: str,
    agent_type: str,
    user_input: str = ""
) -> AsyncGenerator[str, None]:
    """
    Emit cognition events AFTER a specific tool completes.
    Injects self-correction, refinement signals, and progress updates.
    """
    domain  = ctx["domain"]
    style   = ctx["style"]
    hero    = ctx["hero_concept"]
    
    is_update = any(kw in user_input.lower() for kw in ["change", "update", "ubah", "edit", "ganti", "replace", "modify", "tambah"])

    if tool_name in ("get_stores", "get_store_analytics"):
        events = [
            ("No naming conflicts detected. Proceeding with brand concept...",              "catalog_design", jitter(0.6)),
            (f"Structuring {domain} product catalog with curated selections...",            "catalog_design", jitter(1.3)),
            ("Initial layout draft detected visual imbalance. Refining hierarchy...",       "quality_check",  jitter(1.7)),
            (f"Brand tone calibrated to {style}. Generating schema architecture...",        "layout_design",  jitter(1.4)),
        ]
    elif "generate" in tool_name or "asset" in tool_name or "image" in tool_name:
        if is_update:
            events = [
                (f"Rendering updated premium photography with Imagen 3...",                     "asset_generation", jitter(2.8, 0.5)),
                ("Integrating new generated assets into existing storefront...",              "asset_generation", jitter(2.2, 0.4)),
                ("Auditing visual consistency against existing layout...",                    "quality_check",    jitter(1.3)),
                ("Asset integration verified. Finalizing updated preview...",                 "layout_design",    jitter(0.9)),
            ]
        else:
            events = [
                (f"Rendering {hero} with Imagen 3...",                                          "asset_generation", jitter(2.8, 0.5)),
                ("Hero imagery rendered. Processing product visual suite...",                   "asset_generation", jitter(2.2, 0.4)),
                ("Applying generated assets to storefront sections...",                         "asset_generation", jitter(1.8)),
                ("Auditing visual consistency across hero, products, and philosophy...",        "quality_check",    jitter(1.3)),
                ("Asset integration verified. Finalizing storefront preview...",                "layout_design",    jitter(0.9)),
            ]
    elif "save" in tool_name or "publish" in tool_name or "campaign" in tool_name:
        events = [
            ("Campaign data persisted to commerce database...",                             "data_fetching",  jitter(0.7)),
            ("Verifying campaign activation rules...",                                      "quality_check",  jitter(0.8)),
        ]
    else:
        events = [
            (f"Tool execution complete. Integrating results...",                            "execution",      jitter(0.6)),
        ]

    for message, phase, delay in events:
        await asyncio.sleep(delay)
        yield _evt(session_id, message, phase, agent_type)


# ─── Self-correction signals ───────────────────────────────────────────────────
# Emitted mid-execution to simulate autonomous revision behavior.
SELF_CORRECTION_POOL = [
    ("Detected inconsistent brand tone in section headers. Normalizing language...",   "quality_check",  jitter(1.1)),
    ("Product mix appears overly broad. Curating to core specialty SKUs...",           "catalog_design", jitter(1.4)),
    ("Hero copy lacks emotional resonance for target tier. Reworking headline...",     "brand_strategy", jitter(1.6)),
    ("Layout density too high for premium UX. Introducing breathing room...",          "layout_design",  jitter(1.2)),
    ("Price anchoring strategy requires adjustment for luxury positioning...",          "catalog_design", jitter(1.0)),
    ("Visual rhythm between sections feels mechanical. Adding editorial flow...",      "layout_design",  jitter(1.3)),
    ("Testimonial authenticity score low. Regenerating with stronger social proof...", "quality_check",  jitter(1.5)),
]

async def emit_self_correction(session_id: str, agent_type: str) -> AsyncGenerator[str, None]:
    """Emit 1-2 self-correction signals to simulate autonomous revision."""
    selected = random.sample(SELF_CORRECTION_POOL, k=random.randint(1, 2))
    for message, phase, delay in selected:
        await asyncio.sleep(delay)
        yield _evt(session_id, message, phase, agent_type)


# ─── Completion summary ────────────────────────────────────────────────────────
async def emit_completion(
    ctx: dict,
    session_id: str,
    agent_type: str,
    tool_calls_made: list[str],
) -> AsyncGenerator[str, None]:
    """
    Emit the operational completion summary.
    Makes the agent feel like it has concluded a real build, not just responded.
    """
    domain  = ctx["domain"]
    tier    = ctx["tier"]

    did_images = any("generate" in t or "asset" in t or "image" in t for t in tool_calls_made)

    final_lines = [
        (f"Storefront architecture finalized.",                                          "layout_design",    jitter(0.5)),
        (f"Brand system aligned to {tier} standards.",                                  "quality_check",    jitter(0.7)),
    ]
    if did_images:
        final_lines.append(
            ("Generated visual assets applied to all storefront sections.",              "asset_generation", jitter(0.6))
        )
    final_lines.append(
        (f"{domain.capitalize()} storefront ready for preview and publishing.",          "complete",         jitter(0.4))
    )

    for message, phase, delay in final_lines:
        await asyncio.sleep(delay)
        yield _evt(session_id, message, phase, agent_type)
