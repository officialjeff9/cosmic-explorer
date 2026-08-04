"""
Telescope Telemetry Simulator

Generates realistic simulated telemetry from a ground-based / space-based
telescope array. Emits housekeeping data, pointing logs, detector
read-out statistics, and weather/seeing conditions at configurable rates.

This pipeline feeds the TelemetryFeed component in the frontend via the
WebSocket broadcast channel.
"""

from __future__ import annotations

import asyncio
import random
import math
from datetime import datetime, timezone

import numpy as np

from backend.ws.manager import ConnectionManager

# ── Telescope instrument catalogue ─────────────────────────────────────────

INSTRUMENTS = [
    "NIRCAM", "MIRI", "NIRSpec", "WFI", "ACIS-S", "HRC", "ACS/WFC",
    "LUVOIR-A", "WFC3/IR", "ESPRESSO",
]

TELESCOPE_NAMES = [
    "JWST", "HST", "Chandra", "XMM-Newton",
    "Vera Rubin", "VLT UT1", "Keck-I", "ELT",
]

# ── Realistic log message templates ───────────────────────────────────────

INFO_MESSAGES = [
    "Slewing to new field centre {ra:.4f}h {dec:+.3f}°",
    "Guide star acquired: mag {mag:.2f}, FWHM {fwhm:.2f}″",
    "Detector read-out frame {frame}: bias={bias:.1f}ADU, dark={dark:.2f}e⁻/s",
    "Filter wheel: {inst} switching to {filt}",
    "Dither pattern position {pos}/9 reached",
    "Science exposure #{n} started — {exp:.1f}s integration",
    "WCS solution: rms={rms:.3f}″, nstars={nstars}",
    "Atmospheric dispersion corrector updated: airmass={am:.2f}",
    "Thermal control: primary mirror T={temp:.2f}K",
    "Data volume written: {size:.1f} MB to /obs/raw/{night}/",
]

WARN_MESSAGES = [
    "Seeing degraded: FWHM {fwhm:.2f}″ (limit 1.5″)",
    "Wind speed {wind:.1f} m/s — approaching dome closure threshold",
    "Cosmic ray event on {inst} detector row {row}",
    "Guide star flux drop {pct:.0f}% — checking cloud transparency",
    "Flexure compensation limit reached on {inst}: offset {off:.1f}mm",
]

DATA_MESSAGES = [
    "Photon count rate: {rate:.0f} e⁻/s (sky={sky:.1f})",
    "RV precision: {rv:.2f} m/s on {target}",
    "PSF ellipticity: e1={e1:.4f}, e2={e2:.4f}",
    "Background level: {bg:.1f} ADU/px",
    "Spectral resolution: λ/Δλ = {res:,}",
]

FILTERS = ["B", "V", "R", "I", "J", "H", "K", "u", "g", "r", "i", "z"]


def _fill(template: str) -> str:
    """Fill a message template with plausible random values."""
    return template.format(
        ra=random.uniform(0, 24),
        dec=random.uniform(-90, 90),
        mag=random.uniform(8, 20),
        fwhm=random.uniform(0.4, 2.5),
        frame=random.randint(1, 9999),
        bias=random.uniform(500, 600),
        dark=random.uniform(0.001, 0.05),
        inst=random.choice(INSTRUMENTS),
        filt=random.choice(FILTERS),
        pos=random.randint(1, 9),
        n=random.randint(1, 500),
        exp=random.uniform(30, 3600),
        rms=random.uniform(0.01, 0.3),
        nstars=random.randint(20, 300),
        am=random.uniform(1.0, 2.5),
        temp=random.gauss(6.5, 0.05),
        size=random.uniform(1, 800),
        wind=random.uniform(0, 25),
        row=random.randint(0, 4095),
        pct=random.uniform(5, 40),
        off=random.uniform(0, 1),
        rate=random.uniform(1e3, 1e6),
        sky=random.uniform(5, 200),
        rv=random.uniform(0.1, 5),
        target=random.choice(["51 Peg", "Tau Ceti", "HD 40307"]),
        e1=random.gauss(0, 0.01),
        e2=random.gauss(0, 0.01),
        bg=random.uniform(100, 800),
        res=random.randint(1000, 150000),
    )


class TelescopeTelemetrySimulator:
    """Produces a continuous stream of realistic telescope housekeeping logs."""

    def __init__(self, manager: ConnectionManager) -> None:
        self.manager = manager

    async def run(self) -> None:
        while True:
            await self._emit_batch()
            await asyncio.sleep(random.uniform(0.8, 2.5))

    async def _emit_batch(self) -> None:
        telescope = random.choice(TELESCOPE_NAMES)
        instrument = random.choice(INSTRUMENTS)

        # Pick level and message pool
        roll = random.random()
        if roll < 0.60:
            level = "info"
            msg = _fill(random.choice(INFO_MESSAGES))
        elif roll < 0.80:
            level = "data"
            msg = _fill(random.choice(DATA_MESSAGES))
        elif roll < 0.95:
            level = "warn"
            msg = _fill(random.choice(WARN_MESSAGES))
        else:
            level = "error"
            msg = f"[{instrument}] hardware fault — watchdog timeout. Attempting recovery…"

        entry = {
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "source": telescope,
            "level": level,
            "message": msg,
        }
        await self.manager.broadcast("telemetry", entry)
