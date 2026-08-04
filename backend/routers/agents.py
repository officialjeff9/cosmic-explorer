"""REST endpoints for agent status queries."""

from fastapi import APIRouter
from backend.state import observatory_state

router = APIRouter()


@router.get("/")
async def list_agents():
    """Return current status of all agents."""
    return observatory_state.agents


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Return status of a specific agent by ID."""
    agent = observatory_state.get_agent(agent_id)
    if agent is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return agent
