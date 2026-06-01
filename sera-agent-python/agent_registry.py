import os
from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from agents.store_agent import store_agent
from agents.analytics_agent import analytics_agent
from agents.marketing_agent import marketing_agent
from agents.buyer_agent import buyer_agent
from agents.veo_agent import veo_agent
from utils.logger import logger

# One InMemorySessionService per agent type to isolate sessions
store_session_svc     = InMemorySessionService()
analytics_session_svc = InMemorySessionService()
marketing_session_svc = InMemorySessionService()
buyer_session_svc     = InMemorySessionService()
veo_session_svc       = InMemorySessionService()

# Initialize Runner containers for each agent
store_runner     = Runner(agent=store_agent,     session_service=store_session_svc,     app_name="store_agent_app",     auto_create_session=True)
analytics_runner = Runner(agent=analytics_agent, session_service=analytics_session_svc, app_name="analytics_agent_app", auto_create_session=True)
marketing_runner = Runner(agent=marketing_agent, session_service=marketing_session_svc, app_name="marketing_agent_app", auto_create_session=True)
buyer_runner     = Runner(agent=buyer_agent,     session_service=buyer_session_svc,     app_name="buyer_agent_app",     auto_create_session=True)
veo_runner       = Runner(agent=veo_agent,       session_service=veo_session_svc,       app_name="veo_agent_app",       auto_create_session=True)

RUNNERS = {
    "store_agent":     store_runner,
    "analytics_agent": analytics_runner,
    "marketing_agent": marketing_runner,
    "buyer_agent":     buyer_runner,
    "veo_agent":       veo_runner,
}

SESSION_SVCS = {
    "store_agent":     store_session_svc,
    "analytics_agent": analytics_session_svc,
    "marketing_agent": marketing_session_svc,
    "buyer_agent":     buyer_session_svc,
    "veo_agent":       veo_session_svc,
}

def get_runner(agent_type: str) -> Runner:
    """Retrieves the Runner container corresponding to the specified agent type."""
    logger.info(f"Retrieving runner for agent_type: '{agent_type}'")
    return RUNNERS.get(agent_type, store_runner)

async def reset_session(agent_type: str, user_id: str, session_id: str):
    """
    Delete and recreate the ADK session before each run.
    This prevents base64 image blobs and large tool results from
    previous requests accumulating in InMemorySessionService and
    exploding the token count on the next call.
    """
    svc = SESSION_SVCS.get(agent_type, store_session_svc)
    app_name = f"{agent_type}_app"
    try:
        await svc.delete_session(app_name=app_name, user_id=user_id, session_id=session_id)
        logger.info(f"🗑️  Deleted session {session_id} for {agent_type}")
    except Exception:
        pass  # Session may not exist yet — that's fine
    await svc.create_session(app_name=app_name, user_id=user_id, session_id=session_id)
    logger.info(f"✨ Fresh session {session_id} created for {agent_type}")

