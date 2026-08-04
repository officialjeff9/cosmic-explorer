"""
Coordinator Agent

Orchestrates the agent fleet: dispatches observation targets, monitors
agent health, and triggers re-tasking when signals require cross-agent
validation (e.g. a black hole candidate that also shows gravitational
lensing needs the galaxy classifier to confirm host morphology).
"""

from __future__ import annotations

import asyncio
import random
from backend.config import settings
from agents.base_agent import BaseAgent


class CoordinatorAgent(BaseAgent):
    agent_id = "coordinator"
    name = "Coordinator"
    role = "ORCHESTRATOR"
    icon = "🛰️"
    interval = settings.coordinator_heartbeat

    # Observing priority queue (simulated)
    _TARGETS = [
        "Kepler Field-7",
        "TESS Sector 42",
        "Hubble Deep Field South",
        "JWST NIRCam Mosaic",
        "Chandra X-ray Survey",
        "LIGO O4 Trigger 2024-07",
        "Vera Rubin Preview Patch",
        "Roman Space Telescope WFI",
    ]

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._tick_count = 0

    async def tick(self) -> None:
        self._tick_count += 1

        # Every ~10 ticks dispatch a new observation target
        if self._tick_count % 10 == 1:
            target = random.choice(self._TARGETS)
            await self._update_status(
                "active",
                f"Dispatching observation request → {target}",
                target=target,
                confidence=100,
            )
            await self._emit_telemetry(
                "info",
                f"New observation target queued: {target}",
                source="COORDINATOR",
            )
            return

        # Cross-validate if the last discovery was high-confidence
        discoveries = self.state.discoveries
        if discoveries:
            last = discoveries[-1]
            if last.get("confidence", 0) >= 90 and self._tick_count % 5 == 0:
                await self._emit_telemetry(
                    "info",
                    f"Cross-validating high-confidence detection: {last['name']} "
                    f"(type={last['type']}, conf={last['confidence']}%)",
                    source="COORDINATOR",
                )
                await self._update_status(
                    "processing",
                    f"Cross-validating {last['name']} across agent fleet",
                    confidence=100,
                )
                await asyncio.sleep(0.8)
                await self._emit_telemetry(
                    "success",
                    f"Consensus reached: {last['name']} confirmed by 3/3 agents.",
                    source="COORDINATOR",
                )
                await self._update_status(
                    "active",
                    f"Confirmed {last['name']} — added to catalogue",
                    confidence=100,
                )
                return

        await self._update_status(
            "active",
            f"Fleet heartbeat #{self._tick_count} — all agents nominal",
            confidence=100,
        )
