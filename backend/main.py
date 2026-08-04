"""
Space Observatory — FastAPI Backend Entry Point
Manages WebSocket streams, REST endpoints, and agent orchestration.
"""

from contextlib import asynccontextmanager
import asyncio
import structlog

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routers import observatory, agents, discoveries
from backend.ws.manager import ws_manager
from backend.services.agent_runner import AgentRunner

log = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background agent tasks on startup, cancel on shutdown."""
    log.info("observatory.startup", version="0.1.0")
    runner = AgentRunner(ws_manager)
    task = asyncio.create_task(runner.run_all())
    app.state.agent_runner = runner
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    log.info("observatory.shutdown")


app = FastAPI(
    title="Space Observatory API",
    description="Multi-agent deep-space observation backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(observatory.router, prefix="/ws",      tags=["websocket"])
app.include_router(agents.router,      prefix="/api/agents",      tags=["agents"])
app.include_router(discoveries.router, prefix="/api/discoveries",  tags=["discoveries"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
