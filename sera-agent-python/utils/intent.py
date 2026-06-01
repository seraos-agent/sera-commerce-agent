import re

def classify_intent_local(user_input: str) -> str | None:
    """Fast heuristic layer to catch simple greetings and bypass LLM inference."""
    cleaned = re.sub(r'[^\w\s]', '', user_input.lower()).strip()
    
    greetings = {"hey", "hi", "hello", "halo", "hai", "helo", "yo", "morning", "pagi", "siang", "sore", "malam"}
    thanks = {"thanks", "thank you", "makasih", "terima kasih", "thx", "ok", "okay", "sip", "mantap", "good"}
    identity = {"who", "what", "siapa", "apa"}
    
    words = set(cleaned.split())
    if len(words) <= 4:
        if words.intersection(greetings):
            return "CONVERSATIONAL_GREETING"
        if words.intersection(thanks):
            return "CONVERSATIONAL_THANKS"
        if words.intersection(identity) and ("are" in words or "you" in words or "kamu" in words):
            return "CONVERSATIONAL_IDENTITY"
            
    return None

async def classify_intent(user_input: str) -> str:
    """Classifies user intent deterministically without external LLM API calls."""
    local_intent = classify_intent_local(user_input)
    if local_intent:
        return local_intent
        
    cleaned = user_input.lower()
    
    # Execution keywords
    execution_kws = ["build", "create", "generate", "modify", "publish", "redesign", "analyze", "optimize", "buat", "tambah", "ganti", "bikin", "change", "update", "ubah", "edit", "replace", "analisis", "analytics", "performa", "revenue"]
    if any(kw in cleaned for kw in execution_kws):
        return "EXECUTION"
        
    # Reasoning keywords
    reasoning_kws = ["how", "why", "explain", "strategy", "conceptual", "meaning", "think", "should", "kenapa", "bagaimana", "strategi", "menurut"]
    if any(kw in cleaned for kw in reasoning_kws):
        return "REASONING"
        
    # Strict rule: Fallback to CONVERSATIONAL if ambiguous
    return "CONVERSATIONAL"
