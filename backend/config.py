"""Application configuration via environment variables / .env file."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    redis_url: str = "redis://localhost:6379"
    log_level: str = "info"
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Agent tuning
    exoplanet_scan_interval: float = 4.0   # seconds between photometry scans
    blackhole_scan_interval: float = 6.0   # seconds between GW / X-ray checks
    galaxy_scan_interval:    float = 8.0   # seconds between imaging scans
    coordinator_heartbeat:   float = 2.0   # coordinator tick rate


settings = Settings()
