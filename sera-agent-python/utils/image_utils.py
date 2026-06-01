import base64
import io
import time
import asyncio
import random
from vertexai.preview.vision_models import ImageGenerationModel
from utils.logger import logger

async def generate_image_with_imagen(prompt: str, aspect_ratio: str = "1:1") -> str:
    """
    Generates an image using Vertex AI's imagen-3.0-generate-002 model.
    Supports a retry mechanism (max 3 retries) with exponential backoff and jitter.
    Returns a base64 encoded data URI (data:image/jpeg;base64,...).
    """
    model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-002")
    
    # Map ratio to Vertex AI expected formats
    ratio = aspect_ratio
    if ratio not in ["1:1", "3:4", "4:3", "9:16", "16:9"]:
        ratio = "1:1"
        
    max_retries = 3
    
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"🎨 [Imagen 3] Requesting prompt: '{prompt}', ratio: '{ratio}' (Attempt {attempt+1}/{max_retries+1})")
            
            # Wrap blocking Vertex AI call in a thread to keep async event loop responsive
            response = await asyncio.to_thread(
                model.generate_images,
                prompt=prompt,
                number_of_images=1,
                aspect_ratio=ratio
            )
            
            if not response or not response.images:
                raise Exception("No images returned from Vertex AI Imagen model.")
                
            img = response.images[0]
            
            # Extract bytes safely
            try:
                if hasattr(img, "_image_bytes") and img._image_bytes:
                    img_bytes = img._image_bytes
                elif hasattr(img, "_pil_image") and img._pil_image:
                    buf = io.BytesIO()
                    img._pil_image.save(buf, format="JPEG")
                    img_bytes = buf.getvalue()
                else:
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG")
                    img_bytes = buf.getvalue()
            except Exception as byte_err:
                logger.error(f"Byte extraction failed: {str(byte_err)}, trying fallback save.")
                buf = io.BytesIO()
                img.save(buf)
                img_bytes = buf.getvalue()
                
            base64_str = base64.b64encode(img_bytes).decode("utf-8")
            return f"data:image/jpeg;base64,{base64_str}"
            
        except Exception as e:
            logger.error(f"❌ [Imagen 3 Error] Attempt {attempt+1} failed: {str(e)}")
            if attempt == max_retries:
                raise e
            # Exponential backoff with jitter
            delay = (2 ** attempt) + random.uniform(0, 1)
            await asyncio.sleep(delay)
