"""
Agent Runner — orchestrates all agents and drives the telemetry pipeline.
"""

from __future__ import annotations

import asyncio
import structlog

from backend.ws.manager import ConnectionManager
from backend.state import observatory_state

# Import agent modules
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from agents.coordinator import CoordinatorAgent
from agents.exoplanet_hunter import ExoplanetHunterAgent
from agents.blackhole_hunter import BlackHoleHunterAgent
from agents.galaxy_classifier import GalaxyClassifierAgent
from pipelines.telemetry_simulator import TelescopeTelemetrySimulator

log = structlog.get_logger(__name__)


class AgentRunner:
    def __init__(self, manager: ConnectionManager) -> None:
        self.manager = manager
        self.coordinator    = CoordinatorAgent(manager, observatory_state)
        self.exoplanet      = ExoplanetHunterAgent(manager, observatory_state)
        self.blackhole      = BlackHoleHunterAgent(manager, observatory_state)
        self.galaxy         = GalaxyClassifierAgent(manager, observatory_state)
        self.telemetry_sim  = TelescopeTelemetrySimulator(manager)

    async def run_all(self) -> None:
        log.info("agent_runner.start")
        await asyncio.gather(
            self.coordinator.run(),
            self.exoplanet.run(),
            self.blackhole.run(),
            self.galaxy.run(),
            self.telemetry_sim.run(),
        )
