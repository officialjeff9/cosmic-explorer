"""REST endpoints for the discovery catalogue."""

from fastapi import APIRouter, Query
from backend.state import observatory_state

router = APIRouter()


@router.get("/")
async def list_discoveries(
    type: str | None = Query(None, description="Filter by type: exoplanet|black_hole|galaxy|unknown"),
    limit: int = Query(100, le=1000),
):
    items = observatory_state.discoveries
    if type:
        items = [d for d in items if d["type"] == type]
    return items[-limit:]


@router.get("/stats")
async def discovery_stats():
    counts: dict[str, int] = {}
    for d in observatory_state.discoveries:
        counts[d["type"]] = counts.get(d["type"], 0) + 1
    return {"total": len(observatory_state.discoveries), "by_type": counts}
