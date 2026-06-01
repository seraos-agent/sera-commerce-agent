import os
from google.adk import Agent
from tools.sera_tools import get_stores, get_products

_dir = os.path.dirname(__file__)
_instruction = open(os.path.join(_dir, "prompts", "buyer_agent.txt"), encoding="utf-8").read()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "sera-495721")
location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
model_path = f"projects/{project_id}/locations/{location}/publishers/google/models/gemini-2.5-flash"

buyer_agent = Agent(
    name="buyer_agent",
    description="Buyer agent for assisting customers in discovering shops and products",
    model=model_path,
    instruction=_instruction,
    tools=[get_stores, get_products]
)
