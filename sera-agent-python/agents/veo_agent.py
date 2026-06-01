import os
from google.adk import Agent
from tools.sera_tools import generate_video_asset

_dir = os.path.dirname(__file__)
_instruction = open(os.path.join(_dir, "prompts", "veo_agent.txt"), encoding="utf-8").read()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "sera-495721")
location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
model_path = f"projects/{project_id}/locations/{location}/publishers/google/models/gemini-2.5-pro"

veo_agent = Agent(
    name="veo_agent",
    description="Video Director agent that generates high-fidelity cinematic videos using Veo",
    model=model_path,
    instruction=_instruction,
    tools=[generate_video_asset]
)
