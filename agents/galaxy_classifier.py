"""
Galaxy Classifier Agent

Applies a simulated Convolutional Neural Network (CNN) morphology
classifier to galaxy imaging data from the Hubble Space Telescope and
JWST. Classifies galaxies into Hubble sequence types (E, S0, Sa–Sd, SB,
Irr) and flags merger candidates for deeper spectroscopic follow-up.
"""

from __future__ import annotations

import asyncio
import random
import numpy as np

from backend.config import settings
from agents.base_agent import BaseAgent


# ── Galaxy imaging catalogue ───────────────────────────────────────────────

GALAXY_CATALOGUE = [
    {"name": "NGC 1300",   "ra":  3.52, "dec":  -19.41, "z": 0.0185, "true_type": "SBb"},
    {"name": "NGC 4889",   "ra": 13.00, "dec":   27.98,  "z": 0.0217, "true_type": "E4"},
    {"name": "M87",        "ra": 12.51, "dec":   12.39,  "z": 0.0044, "true_type": "E0"},
    {"name": "NGC 1232",   "ra":  3.16, "dec":  -20.58,  "z": 0.0053, "true_type": "SAc"},
    {"name": "Arp 220",    "ra": 15.56, "dec":   23.50,  "z": 0.0181, "true_type": "Irr"},
    {"name": "NGC 5128",   "ra": 13.43, "dec":  -43.02,  "z": 0.0018, "true_type": "S0"},
    {"name": "IC 1101",    "ra": 15.17, "dec":    5.74,  "z": 0.0773, "true_type": "E0"},
    {"name": "NGC 6745",   "ra": 19.08, "dec":   40.74,  "z": 0.0160, "true_type": "Irr"},
    {"name": "The Antennae","ra": 12.01,"dec":  -18.87,  "z": 0.0057, "true_type": "Irr"},
    {"name": "NGC 1277",   "ra":  3.24, "dec":   41.57,  "z": 0.0170, "true_type": "S0"},
]

HUBBLE_TYPES = ["E0", "E4", "S0", "Sa", "Sb", "Sc", "SBa", "SBb", "SBc", "Irr"]

MORPHOLOGY_DESCRIPTIONS = {
    "E":   "Smooth elliptical, no visible dust lanes. High Sérsic index n>4.",
    "S0":  "Lenticular: disk present, no spiral arms. Intermediate population.",
    "Sa":  "Tightly wound spiral arms, large central bulge.",
    "Sb":  "Moderately wound spiral arms, intermediate bulge-to-disk ratio.",
    "Sc":  "Loosely wound spirals, small bulge, active star formation.",
    "SBa": "Barred spiral with tightly wound arms and prominent bar.",
    "SBb": "Barred spiral, intermediate winding, strong central bar.",
    "SBc": "Barred spiral with open arms, low bulge fraction.",
    "Irr": "Irregular morphology — likely interaction or merger event.",
}


def _cnn_softmax(true_type: str) -> dict[str, float]:
    """Simulate CNN class probabilities (Dirichlet-distributed)."""
    probs = np.random.dirichlet(np.ones(len(HUBBLE_TYPES)) * 0.3)
    result = dict(zip(HUBBLE_TYPES, probs.tolist()))
    # Bias toward correct class
    correct_key = next(
        (k for k in HUBBLE_TYPES if true_type.startswith(k[:2]) or k.startswith(true_type[:2])),
        HUBBLE_TYPES[0],
    )
    result[correct_key] = result.get(correct_key, 0) + random.uniform(0.3, 0.7)
    # Re-normalise
    total = sum(result.values())
    return {k: v / total for k, v in result.items()}


class GalaxyClassifierAgent(BaseAgent):
    agent_id = "galaxy-classifier"
    name = "Galaxy Classifier"
    role = "MORPHOLOGY CNN"
    icon = "🌌"
    interval = settings.galaxy_scan_interval

    CONFIDENCE_THRESHOLD = 65

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._catalogue_index = 0

    async def tick(self) -> None:
        galaxy = GALAXY_CATALOGUE[self._catalogue_index % len(GALAXY_CATALOGUE)]
        self._catalogue_index += 1

        name = galaxy["name"]
        await self._update_status(
            "processing",
            f"Running CNN morphology classifier on {name}…",
            target=name,
        )
        await self._emit_telemetry(
            "info",
            f"Downloading imaging tile for {name} (z={galaxy['z']:.4f})…",
        )

        await asyncio.sleep(random.uniform(1.0, 2.5))

        probs = _cnn_softmax(galaxy["true_type"])
        top_class, top_prob = max(probs.items(), key=lambda x: x[1])
        confidence = int(top_prob * 100)

        await self._emit_telemetry(
            "data",
            f"{name} → predicted={top_class} ({confidence}%), "
            f"true={galaxy['true_type']}, z={galaxy['z']:.4f}",
        )

        if confidence >= self.CONFIDENCE_THRESHOLD:
            base_type = next(
                (k for k in MORPHOLOGY_DESCRIPTIONS if top_class.startswith(k)),
                None,
            )
            description = MORPHOLOGY_DESCRIPTIONS.get(
                base_type or top_class,
                f"Hubble type {top_class}.",
            )
            if top_class == "Irr":
                description += " Flagged for merger follow-up spectroscopy."

            await self._emit_discovery(
                name=name,
                discovery_type="galaxy",
                ra=galaxy["ra"],
                dec=galaxy["dec"],
                confidence=confidence,
                description=f"Classified as {top_class}. {description}",
            )
            await self._update_status(
                "active",
                f"Classified {name} as {top_class} (conf={confidence}%)",
                target=name,
                confidence=confidence,
            )
            await self._emit_telemetry(
                "success",
                f"Classification complete: {name} → {top_class} ({confidence}%)",
            )
        else:
            await self._update_status(
                "idle",
                f"Low-confidence classification for {name}: {top_class} ({confidence}%)",
                target=name,
                confidence=confidence,
            )
