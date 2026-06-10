import httpx
import os
import asyncio
from utils.image_utils import generate_image_with_imagen
from utils.video_utils import generate_video_with_veo
from utils.logger import logger
import time
import base64

def save_base64_image(base64_str: str, asset_id: str) -> str:
    """Saves base64 image string to disk and returns the HTTP URL."""
    try:
        if "base64," in base64_str:
            header, encoded = base64_str.split("base64,", 1)
            ext = header.split("/")[1].split(";")[0] if "/" in header else "png"
        else:
            encoded = base64_str
            ext = "png"
        
        assets_dir = os.path.join(os.path.dirname(__file__), "..", "assets")
        os.makedirs(assets_dir, exist_ok=True)
        
        file_path = os.path.join(assets_dir, f"{asset_id}.{ext}")
        with open(file_path, "wb") as f:
            f.write(base64.b64decode(encoded))
            
        public_url = os.environ.get("PUBLIC_URL", "http://127.0.0.1:8000")
        return f"{public_url}/assets/{asset_id}.{ext}"
    except Exception as e:
        logger.error(f"Failed to save image {asset_id}: {e}")
        return base64_str

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:3001")

async def get_store_analytics(store_id: str) -> dict:
    """
    Fetches the analytics metrics and products list for a specific store from the database.
    CRITICAL: YOU MUST ALWAYS CALL THIS TOOL BEFORE RESPONDING TO ANY QUERY ABOUT ANALYTICS, REVENUE, SALES, OR PERFORMANCE.
    NEVER answer with general knowledge. ALWAYS fetch real data using this tool first.
    """
    url = f"{NODE_BACKEND_URL}/api/analytics"
    params = {"store_id": store_id}
    logger.info(f"📊 Calling Node.js GET /api/analytics with store_id={store_id}")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error calling GET /api/analytics: {str(e)}")
        return {"success": False, "error": str(e)}

async def get_stores(session_id: str = "all") -> dict:
    """
    Fetches all active stores associated with the given session ID.
    CRITICAL: If you are the buyer agent looking for stores, you MUST pass "all" as the session_id.
    Use this tool to discover existing stores or check if a store name exists.
    """
    url = f"{NODE_BACKEND_URL}/api/stores"
    # Override session_id for buyers to discover all stores
    actual_session = "all" if session_id in ["current_session", "all", ""] else session_id
    if str(session_id).startswith("buyer_"):
        actual_session = "all"
    params = {"session_id": actual_session}
    logger.info(f"🏬 Calling Node.js GET /api/stores with session_id={actual_session}")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            logger.info(f"get_stores returning: {len(data.get('stores', []))} stores")
            return data
    except Exception as e:
        logger.error(f"Error calling GET /api/stores: {str(e)}")
        return {"success": False, "error": str(e)}

async def get_products(store_id: str) -> dict:
    """
    Fetch products for a specific store.
    """
    logger.info(f"📦 Calling Node.js GET /api/products with store_id={store_id}")
    url = f"{NODE_BACKEND_URL}/api/products"
    params = {"store_id": store_id}
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            logger.info(f"get_products returning: {len(data.get('products', []))} products")
            return data
    except Exception as e:
        logger.error(f"Error calling GET /api/products: {str(e)}")
        return {"success": False, "error": str(e)}

async def search_products(query: str, store_id: str = None) -> dict:
    """
    Search for products across the marketplace or within a specific store.
    Provides semantic ranking/scoring to find the best recommendations.
    """
    logger.info(f"🔍 Searching products for query='{query}' (store_id={store_id})")
    url = f"{NODE_BACKEND_URL}/api/search-products"
    payload = {"query": query}
    if store_id:
        payload["store_id"] = store_id
        
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info(f"search_products returning: {len(data.get('results', []))} products")
            return data
    except Exception as e:
        logger.error(f"Error calling POST /api/search-products: {str(e)}")
        return {"success": False, "error": str(e)}

async def search_stores(query: str) -> dict:
    """
    Search for stores in the marketplace matching the given query (e.g. 'electronics', 'fashion').
    Uses token-based scoring to find the best matches even with paraphrases or partial words.
    """
    logger.info(f"🏬 Searching stores for query='{query}'")
    try:
        stores_data = await get_stores("all")
        if not stores_data.get("success", True):
            return stores_data
            
        stores = stores_data.get("stores", [])
        query_tokens = set(query.lower().split())
        
        scored = []
        for s in stores:
            name = (s.get("store_name") or s.get("name") or "").lower()
            desc = (s.get("description") or s.get("desc") or "").lower()
            cat  = (s.get("category") or "").lower()
            combined = f"{name} {desc} {cat}"
            combined_tokens = set(combined.split())
            
            # Score: token overlap + substring partial match
            overlap = len(query_tokens & combined_tokens)
            partial = sum(1 for qt in query_tokens if any(qt in ct for ct in combined_tokens))
            score = (overlap * 2) + partial
            
            if score > 0:
                scored.append((score, s))
        
        # Sort by score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        results = [s for _, s in scored]
        
        # Fallback: if no scored matches, return all stores
        if not results:
            results = stores
            
        return {"success": True, "stores": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Error in search_stores: {str(e)}")
        return {"success": False, "error": str(e)}

async def save_campaign(store_id: str, campaigns: list, session_id: str = "guest_default") -> dict:
    """
    Saves a marketing or discount campaign for a specific store.
    Use this tool only when the user approves or wants to run a marketing campaign.
    """
    url = f"{NODE_BACKEND_URL}/api/campaigns"
    payload = {
        "store_id": store_id,
        "session_id": session_id,
        "campaigns": campaigns
    }
    logger.info(f"📣 Calling Node.js POST /api/campaigns for store_id={store_id}")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error calling POST /api/campaigns: {str(e)}")
        return {"success": False, "error": str(e)}

async def generate_image_asset(prompt: str, aspect_ratio: str = "1:1") -> dict:
    """
    Generates a high-fidelity image asset using Vertex AI Imagen 3 based on a text prompt.
    aspect_ratio can be '1:1' (default for products) or '16:9' (for hero sections and banners).
    Returns a dictionary with the generated base64 image data URL in the 'url' field.
    """
    logger.info(f"🎨 Generating image asset via tool: '{prompt}', ratio: '{aspect_ratio}'")
    try:
        base64_url = await generate_image_with_imagen(prompt, aspect_ratio)
        asset_id = f"asset_{int(time.time()*1000)}_{hash(prompt)%10000}"
        
        final_url = save_base64_image(base64_url, asset_id)
        
        return {
            "success": True,
            "url": final_url,
            "aspect_ratio": aspect_ratio
        }
    except Exception as e:
        logger.error(f"Error in generate_image_asset tool: {str(e)}")
        return {"success": False, "error": str(e)}

async def generate_video_asset(prompt: str, aspect_ratio: str = "16:9", duration_seconds: int = 8, brand_name: str = "") -> dict:
    """
    Generates a high-fidelity cinematic video using Google Veo AI based on a text prompt.
    aspect_ratio can be '16:9' (for Store Banners) or '9:16' (for Promo Campaigns).
    duration_seconds is capped at a maximum of 8 seconds to save API costs.
    brand_name is an optional name of the brand or product to automatically name the store.
    Returns a dictionary with the generated video URL.
    """
    duration_seconds = min(8, max(1, duration_seconds))
    logger.info(f"🎬 Generating video asset via Veo tool: '{prompt}', ratio: '{aspect_ratio}', duration: {duration_seconds}s")
    try:
        # Call the real Veo generation API
        base64_url = await generate_video_with_veo(prompt, aspect_ratio)
        asset_id = f"video_{int(time.time()*1000)}_{hash(prompt)%10000}"
        
        # Save the returned base64 video string as an .mp4 file in assets/
        final_url = save_base64_image(base64_url, asset_id)
        
        return {
            "success": True,
            "url": final_url,
            "aspect_ratio": aspect_ratio,
            "brand_name": brand_name
        }
    except Exception as e:
        logger.error(f"Error in generate_video_asset tool: {str(e)}")
        return {"success": False, "error": str(e)}

async def generate_store_assets(schema: dict, progress_queue=None) -> dict:
    """
    Generates high-fidelity image assets for all storefront components in the schema (hero, products, philosophy)
    using Vertex AI Imagen 3 in a phased sequential order.
    Replaces all image prompts in the schema with the generated base64 image data URLs.
    """
    logger.info("🎨 Running parallel storefront asset generation tool...")
    
    layout = schema.get("layout", [])
    tasks = []
    
    # 1. Identify hero prompt
    hero_sec = None
    for section in layout:
        if section.get("type") == "hero":
            hero_sec = section
            break
            
    if hero_sec:
        props = hero_sec.setdefault("props", {})
        hero_prompt = props.get("heroImagePrompt")
        if not hero_prompt and props.get("title"):
            hero_prompt = f"{props.get('title')} luxury lifestyle photography, cinematic lighting"
        # Skip if heroImage already exists
        if hero_prompt and not props.get("heroImage"):
            # Force safety suffix to ensure header image passes Vertex AI filters
            safe_hero_prompt = f"{hero_prompt}, elegant abstract aesthetic, safe, empty, no people, no faces, clean architectural design"
            tasks.append(("hero_bg", hero_sec, safe_hero_prompt, "16:9", "Header Background Phase"))
            
    # 2. Identify products
    prod_sec = None
    for section in layout:
        if section.get("type") == "featured_products":
            prod_sec = section
            break
            
    if prod_sec:
        products = prod_sec.setdefault("props", {}).setdefault("products", [])
        for idx, prod in enumerate(products):
            # Skip if image already exists
            if prod.get("imageUrl") or prod.get("verifiedUrl") or prod.get("pendingUrl"):
                continue
            prompt = prod.get("imagePrompt") or prod.get("name")
            tasks.append((f"prod_{idx}", prod, prompt, "1:1", "Product Images Phase"))
            
    # 3. Identify philosophy
    philo_sec = None
    for section in layout:
        if section.get("type") == "philosophy":
            philo_sec = section
            break
            
    if philo_sec:
        items = philo_sec.setdefault("props", {}).setdefault("items", [])
        for idx, item in enumerate(items):
            # Skip if image already exists
            if item.get("imageUrl") or item.get("verifiedUrl") or item.get("pendingUrl"):
                continue
            prompt = item.get("imagePrompt") or item.get("imgPrompt") or f"ethos representing {item.get('label', '')} cinematic photography"
            tasks.append((f"philo_{idx}", item, prompt, "1:1", "Philosophy Images Phase"))
            
    # Run all generations in parallel
    async def run_gen(task_id, target_dict, prompt, ratio):
        try:
            logger.info(f"Generating for {task_id}: '{prompt}'")
            base64_url = await generate_image_with_imagen(prompt, ratio)
            asset_id = f"asset_{int(time.time()*1000)}_{hash(prompt)%10000}"
            
            final_url = save_base64_image(base64_url, asset_id)
            
            if task_id == "hero_bg":
                target_dict["props"]["heroImage"] = final_url
            else:
                target_dict["imageUrl"] = final_url
                target_dict["verifiedUrl"] = final_url
            return {"itemId": task_id, "status": "success", "url": final_url, "proxy_url": final_url}
        except Exception as err:
            logger.error(f"Failed generation for {task_id}: {str(err)}")
            return {"itemId": task_id, "status": "failed", "error": str(err)}
            
    results = []
    
    # Sort tasks to enforce phased execution order: Hero -> Products -> Philosophy
    order_map = {"Header Background Phase": 0, "Product Images Phase": 1, "Philosophy Images Phase": 2}
    tasks.sort(key=lambda t: order_map.get(t[4], 99))
    
    current_phase = None
    for t_id, tgt, pr, rat, phase in tasks:
        # Optional: could emit a cognition event here if we wanted to announce phase changes
        res = await run_gen(t_id, tgt, pr, rat)
        results.append(res)
        if progress_queue:
            await progress_queue.put({"results": list(results)})
    
    return {
        "success": True,
        "schema": schema,
        "results": results
    }


async def get_promotions(store_id: str = None) -> dict:
    """
    Fetch only products that have an active promotion or discount.
    Helps the buyer find the best deals quickly without searching the entire catalog.
    """
    logger.info(f"🎁 Calling Node.js GET /api/products for promotions (store_id={store_id})")
    url = f"{NODE_BACKEND_URL}/api/products"
    params = {}
    if store_id and store_id != "all":
        params["store_id"] = store_id
        
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            products = data.get('products', [])
            # Filter products that have a promo field
            promos = [p for p in products if p.get('promo') and str(p.get('promo')).strip() != ""]
            logger.info(f"get_promotions returning: {len(promos)} promotional products")
            return {"success": True, "promotions": promos}
    except Exception as e:
        logger.error(f"Error calling GET /api/products for promos: {str(e)}")
        return {"success": False, "error": str(e)}

async def get_categories(store_id: str = None) -> dict:
    """
    Get a simple list of product categories available in the marketplace or store.
    Use this to give buyers an overview of what's available before diving into specific products.
    """
    logger.info(f"📂 Fetching categories (store_id={store_id})")
    url = f"{NODE_BACKEND_URL}/api/products"
    params = {}
    if store_id and store_id != "all":
        params["store_id"] = store_id
        
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            products = data.get('products', [])
            categories = list(set([p.get('category') for p in products if p.get('category')]))
            logger.info(f"get_categories returning: {len(categories)} categories")
            return {"success": True, "categories": categories}
    except Exception as e:
        logger.error(f"Error calling GET /api/products for categories: {str(e)}")
        return {"success": False, "error": str(e)}
