"""Configuration management for Rosetta."""

import os
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    """Application configuration."""

    anthropic_api_key: str
    batch_size: int = 50
    model: str = "claude-sonnet-4-20250514"
    max_retries: int = 3

    @classmethod
    def from_env(cls) -> "Config":
        """Load configuration from environment variables."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY environment variable is required. "
                "Set it with: export ANTHROPIC_API_KEY=your_key_here"
            )

        return cls(
            anthropic_api_key=api_key,
            batch_size=int(os.getenv("ROSETTA_BATCH_SIZE", "50")),
            model=os.getenv("ROSETTA_MODEL", "claude-sonnet-4-20250514"),
            max_retries=int(os.getenv("ROSETTA_MAX_RETRIES", "3")),
        )
