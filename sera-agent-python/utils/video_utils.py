import os
import time
import base64
from google import genai
from google.genai import types
from utils.logger import logger

def _sync_generate_video(prompt: str, aspect_ratio: str) -> str:
    """Synchronous function to call Veo API and poll until done."""
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "sera-495721")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    
    client = genai.Client(vertexai=True, project=project_id, location=location)
    
    logger.info(f"🎬 [Veo] Starting video generation operation: '{prompt}', ratio: '{aspect_ratio}'")
    
    # Start the Long Running Operation
    operation = client.models.generate_videos(
        model='veo-2.0-generate-001',
        prompt=prompt,
        config=types.GenerateVideosConfig(
            number_of_videos=1,
            aspect_ratio=aspect_ratio,
            person_generation="ALLOW_ADULT"
        )
    )
    
    # Poll for completion
    poll_count = 0
    while not operation.done:
        poll_count += 1
        logger.info(f"🎬 [Veo] Polling operation {operation.name}... ({poll_count * 10}s elapsed)")
        time.sleep(10)
        # Fetch the latest operation status
        operation = client.operations.get(operation=operation)
        
    if operation.error:
        raise Exception(f"Veo API error: {operation.error}")
        
    if operation.response and operation.response.generated_videos:
        video_bytes = operation.response.generated_videos[0].video.video_bytes
        # Encode as base64 to pass it back
        base64_str = base64.b64encode(video_bytes).decode("utf-8")
        return f"data:video/mp4;base64,{base64_str}"
        
    raise Exception("Veo API returned success but no video bytes were found.")

async def generate_video_with_veo(prompt: str, aspect_ratio: str = "16:9") -> str:
    """
    Generates a video using Vertex AI Veo model.
    Runs the synchronous polling in a thread pool to avoid blocking the asyncio event loop.
    Returns a base64 encoded data URI (data:video/mp4;base64,...).
    """
    import asyncio
    return await asyncio.to_thread(_sync_generate_video, prompt, aspect_ratio)
