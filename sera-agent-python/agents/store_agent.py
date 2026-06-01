import os
from google.adk import Agent
from tools.sera_tools import get_stores, generate_store_assets, generate_image_asset

_dir = os.path.dirname(__file__)
_instruction = open(os.path.join(_dir, "prompts", "store_agent.txt"), encoding="utf-8").read()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "sera-495721")
location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
model_path = f"projects/{project_id}/locations/{location}/publishers/google/models/gemini-2.5-pro"

store_agent = Agent(
    name="store_agent",
    description="Autonomous storefront execution engine — builds, designs, and deploys AI-powered e-commerce stores",
    model=model_path,
    instruction=_instruction,
    tools=[get_stores, generate_store_assets, generate_image_asset]
)
