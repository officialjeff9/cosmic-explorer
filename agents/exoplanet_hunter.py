"""
Exoplanet Hunter Agent

Analyses simulated photometric light curves for transit signals using
the Box Least Squares (BLS) algorithm approach. Calculates transit
depth, duration, and period to estimate planetary radius and orbital
parameters. Emits discoveries when confidence exceeds the threshold.
"""

from __future__ import annotations

import math
import random
import asyncio
import numpy as np

from backend.config import settings
from agents.base_agent import BaseAgent


# ── Simulated stellar catalogue ────────────────────────────────────────────

STELLAR_CATALOGUE = [
    {"star": "KIC 8462852",  "ra": 20.06, "dec": 44.46, "magnitude": 11.7},
    {"star": "TRAPPIST-1",   "ra":  1.51, "dec": -5.04, "magnitude": 18.8},
    {"star": "55 Cancri",    "ra":  8.97, "dec": 28.33, "magnitude": 5.95},
    {"star": "Proxima Cen",  "ra": 14.50, "dec":-62.68, "magnitude": 11.1},
    {"star": "HD 209458",    "ra": 22.03, "dec": 18.88, "magnitude": 7.65},
    {"star": "Kepler-452",   "ra": 19.72, "dec": 44.32, "magnitude": 13.7},
    {"star": "LHS 1140",     "ra":  0.44, "dec":-15.27, "magnitude": 14.2},
    {"star": "GJ 1132",      "ra":  5.09, "dec":-47.16, "magnitude": 13.5},
    {"star": "TOI-700",      "ra":  4.32, "dec":-65.58, "magnitude": 13.0},
]

PLANET_SUFFIXES = ["b", "c", "d", "e", "f"]


def _simulate_transit_lightcurve(
    period_days: float,
    depth_ppm: float,
    n_points: int = 200,
) -> tuple[np.ndarray, np.ndarray]:
    """Generate a synthetic folded light curve with a transit dip."""
    phase = np.linspace(0, 1, n_points)
    flux = np.ones(n_points)
    # Transit window centred at phase=0.5
    transit_mask = np.abs(phase - 0.5) < 0.02
    flux[transit_mask] -= depth_ppm / 1_000_000
    # Add photon noise
    flux += np.random.normal(0, 50e-6, n_points)
    return phase, flux


def _bls_score(depth_ppm: float, noise_level_ppm: float = 80.0) -> float:
    """Very simplified BLS signal-to-noise estimate."""
    if noise_level_ppm == 0:
        return 0.0
    return min(100, int((depth_ppm / noise_level_ppm) * 10))


class ExoplanetHunterAgent(BaseAgent):
    agent_id = "exoplanet-hunter"
    name = "Exoplanet Hunter"
    role = "TRANSIT DETECTION"
    icon = "🪐"
    interval = settings.exoplanet_scan_interval

    # Detection threshold
    CONFIDENCE_THRESHOLD = 70

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._scan_index = 0

    async def tick(self) -> None:
        star = STELLAR_CATALOGUE[self._scan_index % len(STELLAR_CATALOGUE)]
        self._scan_index += 1

        target = star["star"]
        await self._update_status(
            "processing",
            f"Analysing photometry for {target}…",
            target=target,
        )
        await self._emit_telemetry(
            "info",
            f"Starting BLS transit search on {target} (mag {star['magnitude']})",
        )

        # Simulate BLS computation delay
        await asyncio.sleep(random.uniform(0.5, 1.5))

        # Randomly decide whether a transit is detected
        period = round(random.uniform(1.5, 400.0), 2)
        depth_ppm = random.uniform(50, 12000)
        noise_ppm = random.uniform(60, 200)
        score = _bls_score(depth_ppm, noise_ppm)

        # Simulate light curve
        phase, flux = _simulate_transit_lightcurve(period, depth_ppm)
        radius_earth = round(math.sqrt(depth_ppm / 1e6) * 109.2, 2)  # approx

        if score >= self.CONFIDENCE_THRESHOLD:
            suffix = random.choice(PLANET_SUFFIXES)
            planet_name = f"{target} {suffix}"
            await self._emit_telemetry(
                "success",
                f"Transit candidate {planet_name}: P={period:.1f}d, "
                f"depth={depth_ppm:.0f}ppm, Rp≈{radius_earth:.2f}R⊕, score={score:.0f}%",
            )
            await self._emit_discovery(
                name=planet_name,
                discovery_type="exoplanet",
                ra=star["ra"],
                dec=star["dec"],
                confidence=int(score),
                description=(
                    f"Transit signal P={period:.1f}d, depth={depth_ppm:.0f}ppm, "
                    f"Rp≈{radius_earth:.2f}R⊕. BLS SNR={score:.0f}%."
                ),
            )
            await self._update_status(
                "active",
                f"Confirmed transit candidate: {planet_name}",
                target=target,
                confidence=int(score),
            )
        else:
            await self._emit_telemetry(
                "data",
                f"No significant transit in {target}: BLS SNR={score:.0f}% (threshold={self.CONFIDENCE_THRESHOLD}%)",
            )
            await self._update_status(
                "idle",
                f"No transit detected in {target} (BLS SNR={score:.0f}%)",
                target=target,
                confidence=int(score),
            )
