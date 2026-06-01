import os
from google.adk import Agent
from tools.sera_tools import save_campaign, generate_image_asset

_dir = os.path.dirname(__file__)
_instruction = open(os.path.join(_dir, "prompts", "marketing_agent.txt"), encoding="utf-8").read()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "sera-495721")
location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
model_path = f"projects/{project_id}/locations/{location}/publishers/google/models/gemini-2.5-pro"

marketing_agent = Agent(
    name="marketing_agent",
    description="Marketing agent for brainstorming and persisting promotional campaigns and banners",
    model=model_path,
    instruction=_instruction,
    tools=[save_campaign, generate_image_asset]
)
