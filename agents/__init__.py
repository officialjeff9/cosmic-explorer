"""Agents package — re-exports all agent classes for convenience."""

from agents.base_agent import BaseAgent
from agents.coordinator import CoordinatorAgent
from agents.exoplanet_hunter import ExoplanetHunterAgent
from agents.blackhole_hunter import BlackHoleHunterAgent
from agents.galaxy_classifier import GalaxyClassifierAgent

__all__ = [
    "BaseAgent",
    "CoordinatorAgent",
    "ExoplanetHunterAgent",
    "BlackHoleHunterAgent",
    "GalaxyClassifierAgent",
]
