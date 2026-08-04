"""
Black Hole Signal Hunter Agent

Monitors simulated gravitational-wave strain data and X-ray flux
measurements from known active galactic nuclei (AGN) and X-ray binary
candidate fields. Applies a matched-filter algorithm to identify
compact binary merger signatures and QPE (quasi-periodic eruption) events.
"""

from __future__ import annotations

import asyncio
import math
import random
import numpy as np

from backend.config import settings
from agents.base_agent import BaseAgent


# ── Known source catalogue ─────────────────────────────────────────────────

GW_SOURCES = [
    {"id": "GW230529",   "ra": 8.97,  "dec": -3.26,  "type": "BBH",  "snr_base": 12.1},
    {"id": "GW200225",   "ra": 14.73, "dec":  22.14,  "type": "NSBH", "snr_base": 8.4},
    {"id": "GW170817",   "ra": 13.09, "dec": -23.38,  "type": "BNS",  "snr_base": 32.4},
    {"id": "AGN-J0437",  "ra":  4.62, "dec": -47.25,  "type": "AGN",  "snr_base": 15.0},
    {"id": "Cyg X-1",    "ra": 19.96, "dec":  35.20,  "type": "XRB",  "snr_base": 40.0},
    {"id": "SS 433",     "ra": 19.19, "dec":  4.98,   "type": "XRB",  "snr_base": 20.5},
    {"id": "NGC 1277",   "ra":  3.24, "dec":  41.57,  "type": "SMBH", "snr_base": 5.8},
]

MERGER_TYPES = {
    "BBH":  "Binary Black Hole merger",
    "NSBH": "Neutron Star–Black Hole merger",
    "BNS":  "Binary Neutron Star merger",
    "AGN":  "Active Galactic Nucleus flare",
    "XRB":  "X-ray Binary outburst",
    "SMBH": "Supermassive Black Hole candidate",
}


def _matched_filter_snr(base_snr: float, noise: float) -> float:
    """Simulate matched-filter SNR with Gaussian fluctuations."""
    return max(0.0, base_snr + np.random.normal(0, noise))


def _falap_score(snr: float) -> int:
    """False Alarm Rate to confidence mapping (simplified)."""
    # SNR 8 → ~60%, SNR 12 → ~80%, SNR 25 → ~97%
    return min(99, int(60 + 25 * (1 - math.exp(-(snr - 8) / 10))))


class BlackHoleHunterAgent(BaseAgent):
    agent_id = "blackhole-hunter"
    name = "BH Signal Hunter"
    role = "GW / X-RAY ANALYSIS"
    icon = "🕳️"
    interval = settings.blackhole_scan_interval

    SNR_THRESHOLD = 8.0  # LIGO detection threshold

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._source_index = 0

    async def tick(self) -> None:
        source = GW_SOURCES[self._source_index % len(GW_SOURCES)]
        self._source_index += 1

        src_id = source["id"]
        src_type = source["type"]

        await self._update_status(
            "processing",
            f"Running matched filter on {src_id} ({src_type})…",
            target=src_id,
        )
        await self._emit_telemetry(
            "info",
            f"Initiating {src_type} matched-filter scan: {src_id}",
        )

        await asyncio.sleep(random.uniform(0.8, 2.0))

        snr = _matched_filter_snr(source["snr_base"], noise=3.0)
        confidence = _falap_score(snr) if snr >= self.SNR_THRESHOLD else 0

        await self._emit_telemetry(
            "data",
            f"{src_id}: matched-filter SNR={snr:.2f}, confidence={confidence}%",
        )

        if snr >= self.SNR_THRESHOLD and confidence >= 65:
            description = (
                f"{MERGER_TYPES.get(src_type, src_type)}. "
                f"Matched-filter SNR={snr:.2f}. Estimated chirp mass "
                f"{random.uniform(5, 80):.1f}M☉."
            )
            await self._emit_discovery(
                name=src_id,
                discovery_type="black_hole",
                ra=source["ra"],
                dec=source["dec"],
                confidence=confidence,
                description=description,
            )
            await self._update_status(
                "active",
                f"Signal confirmed: {src_id} (SNR={snr:.1f}, conf={confidence}%)",
                target=src_id,
                confidence=confidence,
            )
            await self._emit_telemetry(
                "success",
                f"ALERT — {src_type} signal confirmed: {src_id} SNR={snr:.2f}",
            )
        else:
            await self._update_status(
                "idle",
                f"Sub-threshold signal from {src_id}: SNR={snr:.2f} (need ≥{self.SNR_THRESHOLD})",
                target=src_id,
                confidence=0,
            )
