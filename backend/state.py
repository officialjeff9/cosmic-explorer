"""
In-memory shared state for the observatory backend.

Both the HTTP routers and the WebSocket broadcaster read from / write to
this single object, which is safe for a single-process deployment.
For multi-process deployments, replace with a Redis-backed store.
"""

from __future__ import annotations

import threading
from copy import deepcopy
from typing import Any


class ObservatoryState:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._agents: dict[str, dict[str, Any]] = {}
        self._discoveries: list[dict[str, Any]] = []

    # ── Agent CRUD ────────────────────────────────────────────────────────

    def upsert_agent(self, agent: dict[str, Any]) -> None:
        with self._lock:
            self._agents[agent["id"]] = deepcopy(agent)

    def get_agent(self, agent_id: str) -> dict[str, Any] | None:
        with self._lock:
            return deepcopy(self._agents.get(agent_id))

    @property
    def agents(self) -> list[dict[str, Any]]:
        with self._lock:
            return list(deepcopy(self._agents).values())

    # ── Discoveries ───────────────────────────────────────────────────────

    def add_discovery(self, discovery: dict[str, Any]) -> None:
        with self._lock:
            self._discoveries.append(deepcopy(discovery))

    @property
    def discoveries(self) -> list[dict[str, Any]]:
        with self._lock:
            return deepcopy(self._discoveries)

    # ── Snapshot (sent to new WS clients) ─────────────────────────────────

    def snapshot(self) -> dict[str, Any]:
        return {
            "agents": self.agents,
            "discoveries": self.discoveries,
        }


# Module-level singleton
observatory_state = ObservatoryState()
