"""
WebSocket connection manager.

Keeps a registry of all active WebSocket clients and provides
broadcast / targeted send helpers.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

import structlog
from fastapi import WebSocket

log = structlog.get_logger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.append(ws)
        log.info("ws.client_connected", total=len(self._connections))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections = [c for c in self._connections if c is not ws]
        log.info("ws.client_disconnected", total=len(self._connections))

    async def broadcast(self, event: str, payload: Any) -> None:
        """Send a JSON message to all connected clients."""
        message = json.dumps({"event": event, "payload": payload})
        dead: list[WebSocket] = []
        async with self._lock:
            targets = list(self._connections)
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    @property
    def active_count(self) -> int:
        return len(self._connections)


# Singleton shared across the application
ws_manager = ConnectionManager()
