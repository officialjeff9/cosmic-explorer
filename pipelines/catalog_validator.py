"""
Catalogue Validator Pipeline

Validates newly discovered objects against existing astronomical
catalogues (SIMBAD, NED, Gaia DR3) to flag potential duplicate
detections, cross-match known objects, and assign preliminary
catalogue identifiers (e.g. SOA-2024-XXXX).

In production this would call the real SIMBAD/NED TAP services.
Here we simulate the cross-match logic with an in-memory mock catalogue.
"""

from __future__ import annotations

import asyncio
import math
import random
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


# ── Mock reference catalogue ───────────────────────────────────────────────

@dataclass
class CatalogueEntry:
    simbad_id: str
    common_name: str
    obj_type: str
    ra: float       # hours
    dec: float      # degrees
    magnitude: float


REFERENCE_CATALOGUE: list[CatalogueEntry] = [
    CatalogueEntry("HD 209458",   "HD 209458",     "exoplanet_host", 22.03,  18.88, 7.65),
    CatalogueEntry("GJ 1132",     "GJ 1132",       "exoplanet_host",  5.09, -47.16, 13.5),
    CatalogueEntry("M87",         "M87",           "galaxy",         12.51,  12.39, 8.60),
    CatalogueEntry("NGC 1300",    "NGC 1300",      "galaxy",          3.52, -19.41, 11.4),
    CatalogueEntry("Cyg X-1",     "Cygnus X-1",    "xrb",            19.96,  35.20, 8.95),
    CatalogueEntry("SS 433",      "SS 433",        "xrb",            19.19,   4.98, 14.2),
    CatalogueEntry("GW170817",    "GW170817",      "bns_merger",     13.09, -23.38, 99.0),
    CatalogueEntry("TRAPPIST-1",  "TRAPPIST-1",    "exoplanet_host",  1.51,  -5.04, 18.8),
    CatalogueEntry("IC 1101",     "IC 1101",       "galaxy",         15.17,   5.74, 14.7),
]


# ── Angular separation helper (Haversine on celestial sphere) ──────────────

def _angular_sep_deg(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """
    Return angular separation in degrees between two celestial coordinates.
    RA in hours, Dec in degrees.
    """
    ra1_r  = math.radians(ra1 * 15)
    ra2_r  = math.radians(ra2 * 15)
    dec1_r = math.radians(dec1)
    dec2_r = math.radians(dec2)
    d = (
        math.sin((dec2_r - dec1_r) / 2) ** 2
        + math.cos(dec1_r) * math.cos(dec2_r) * math.sin((ra2_r - ra1_r) / 2) ** 2
    )
    return math.degrees(2 * math.asin(math.sqrt(d)))


# ── Validator result ───────────────────────────────────────────────────────

@dataclass
class ValidationResult:
    soa_id: str
    is_known: bool
    matched_entry: Optional[CatalogueEntry]
    separation_arcsec: Optional[float]
    status: str   # "new" | "known" | "duplicate_candidate" | "uncertain"
    notes: str


# ── Validator class ────────────────────────────────────────────────────────

class CatalogueValidator:
    """
    Cross-matches a candidate discovery against the reference catalogue.

    Parameters
    ----------
    match_radius_arcsec : float
        Positional coincidence threshold in arcseconds.
    """

    def __init__(self, match_radius_arcsec: float = 30.0) -> None:
        self._radius_deg = match_radius_arcsec / 3600.0
        self._issued_ids: set[str] = set()

    def validate(
        self,
        ra: float,
        dec: float,
        obj_type: str,
        name: str,
    ) -> ValidationResult:
        """Synchronously validate a candidate object."""
        soa_id = self._next_id()
        best_sep: float | None = None
        best_match: CatalogueEntry | None = None

        for entry in REFERENCE_CATALOGUE:
            sep = _angular_sep_deg(ra, dec, entry.ra, entry.dec)
            if best_sep is None or sep < best_sep:
                best_sep = sep
                best_match = entry

        best_sep_arcsec = (best_sep * 3600) if best_sep is not None else None

        if best_sep is not None and best_sep <= self._radius_deg:
            status = "known"
            notes = (
                f"Positional match with {best_match.simbad_id} "
                f"(sep={best_sep_arcsec:.1f}\", type={best_match.obj_type})"
            )
            return ValidationResult(
                soa_id=soa_id,
                is_known=True,
                matched_entry=best_match,
                separation_arcsec=best_sep_arcsec,
                status=status,
                notes=notes,
            )
        elif best_sep is not None and best_sep <= self._radius_deg * 3:
            status = "duplicate_candidate"
            notes = (
                f"Possible association with {best_match.simbad_id} "
                f"(sep={best_sep_arcsec:.1f}\" — within 3× match radius)"
            )
            return ValidationResult(
                soa_id=soa_id,
                is_known=False,
                matched_entry=best_match,
                separation_arcsec=best_sep_arcsec,
                status=status,
                notes=notes,
            )
        else:
            return ValidationResult(
                soa_id=soa_id,
                is_known=False,
                matched_entry=None,
                separation_arcsec=best_sep_arcsec,
                status="new",
                notes=f"No catalogue match within {self._radius_deg * 3600:.0f}\". "
                      f"Nearest: {best_match.simbad_id} at {best_sep_arcsec:.0f}\".",
            )

    async def validate_async(
        self, ra: float, dec: float, obj_type: str, name: str
    ) -> ValidationResult:
        """Async wrapper — simulates a short network I/O delay (TAP query)."""
        await asyncio.sleep(random.uniform(0.05, 0.3))
        return self.validate(ra, dec, obj_type, name)

    def _next_id(self) -> str:
        year = datetime.now(timezone.utc).year
        suffix = str(uuid.uuid4())[:6].upper()
        soa_id = f"SOA-{year}-{suffix}"
        self._issued_ids.add(soa_id)
        return soa_id


# ── Module-level singleton ─────────────────────────────────────────────────

default_validator = CatalogueValidator(match_radius_arcsec=30.0)
