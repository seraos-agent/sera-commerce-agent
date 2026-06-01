import os
from google.adk import Agent
from tools.sera_tools import get_store_analytics

_dir = os.path.dirname(__file__)
_instruction = open(os.path.join(_dir, "prompts", "analytics_agent.txt"), encoding="utf-8").read()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "sera-495721")
location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
model_path = f"projects/{project_id}/locations/{location}/publishers/google/models/gemini-2.5-pro"

analytics_agent = Agent(
    name="analytics_agent",
    description="Analytics agent for fetching, analyzing, and reporting store metrics",
    model=model_path,
    instruction=_instruction,
    tools=[get_store_analytics]
)
