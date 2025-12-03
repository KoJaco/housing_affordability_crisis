"""Configuration settings."""
import os
from pathlib import Path

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///src/db/database.sqlite"
)

# API configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# Project root
PROJECT_ROOT = Path(__file__).parent.parent
