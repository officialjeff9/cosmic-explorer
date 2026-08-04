"""WebSocket route — clients connect here to receive live observatory events."""

from __future__ import annotations

import json
import asyncio
import structlog

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.ws.manager import ConnectionManager, ws_manager
from backend.state import observatory_state

log = structlog.get_logger(__name__)
router = APIRouter()


@router.websocket("/observatory")
async def observatory_ws(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        # Send current snapshot on connect so the client can hydrate immediately
        snapshot = observatory_state.snapshot()
        await ws.send_text(
            json.dumps({"event": "snapshot", "payload": snapshot})
        )

        # Keep the connection alive; the client may send pings
        while True:
            data = await asyncio.wait_for(ws.receive_text(), timeout=30.0)
            if data == "ping":
                await ws.send_text(json.dumps({"event": "pong", "payload": {}}))
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    finally:
        await ws_manager.disconnect(ws)
