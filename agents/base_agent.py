"""
Base Agent class — shared infrastructure for all observatory agents.
"""

from __future__ import annotations

import asyncio
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

import structlog

from backend.ws.manager import ConnectionManager
from backend.state import ObservatoryState

log = structlog.get_logger(__name__)


class BaseAgent(ABC):
    """
    Every observatory agent inherits from this class.

    Subclasses must implement:
        - ``agent_id``  (class-level str)
        - ``name``      (class-level str)
        - ``role``      (class-level str)
        - ``icon``      (class-level str)
        - ``tick()``    (async method — one unit of work)
        - ``interval``  (class-level float — seconds between ticks)
    """

    agent_id: str
    name: str
    role: str
    icon: str
    interval: float = 5.0

    def __init__(
        self,
        manager: ConnectionManager,
        state: ObservatoryState,
    ) -> None:
        self.manager = manager
        self.state = state
        self._status: str = "idle"
        self._tasks_completed: int = 0
        self._current_target: str | None = None
        self._confidence: int = 0

        # Register self in shared state
        self.state.upsert_agent(self._agent_dict("idle", "Agent initialised."))

    # ── Public API ────────────────────────────────────────────────────────

    async def run(self) -> None:
        """Main loop — calls tick() at the configured interval."""
        log.info("agent.started", agent=self.agent_id)
        while True:
            try:
                await self.tick()
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                log.error("agent.tick_error", agent=self.agent_id, error=str(exc))
                await self._update_status("alert", f"Error: {exc}")
            await asyncio.sleep(self.interval)

    @abstractmethod
    async def tick(self) -> None:
        """Override with agent-specific logic."""

    # ── Helpers ───────────────────────────────────────────────────────────

    async def _update_status(
        self,
        status: str,
        last_event: str,
        target: str | None = None,
        confidence: int | None = None,
    ) -> None:
        self._status = status
        if target is not None:
            self._current_target = target
        if confidence is not None:
            self._confidence = confidence

        agent_dict = self._agent_dict(status, last_event)
        self.state.upsert_agent(agent_dict)
        await self.manager.broadcast("agent_update", agent_dict)

    async def _emit_discovery(
        self,
        name: str,
        discovery_type: str,
        ra: float,
        dec: float,
        confidence: int,
        description: str,
    ) -> None:
        discovery = {
            "id": str(uuid.uuid4()),
            "name": name,
            "type": discovery_type,
            "ra": ra,
            "dec": dec,
            "confidence": confidence,
            "description": description,
            "detectedAt": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "agentId": self.agent_id,
        }
        self.state.add_discovery(discovery)
        await self.manager.broadcast("discovery", discovery)
        self._tasks_completed += 1
        log.info(
            "agent.discovery",
            agent=self.agent_id,
            name=name,
            type=discovery_type,
            confidence=confidence,
        )

    async def _emit_telemetry(
        self, level: str, message: str, source: str | None = None
    ) -> None:
        entry = {
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "source": source or self.agent_id.upper(),
            "level": level,
            "message": message,
        }
        await self.manager.broadcast("telemetry", entry)

    def _agent_dict(self, status: str, last_event: str) -> dict[str, Any]:
        return {
            "id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "icon": self.icon,
            "status": status,
            "tasksCompleted": self._tasks_completed,
            "currentTarget": self._current_target,
            "confidence": self._confidence,
            "lastEvent": last_event,
        }
