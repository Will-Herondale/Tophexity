"""AI health check endpoint logic."""

import time

from app.core.config import get_settings
from app.services.ai.client import get_ai_client
from app.services.ai.models import AIHealthStatus

settings = get_settings()


async def check_ai_health() -> AIHealthStatus:
    """Run full AI health check."""
    client = get_ai_client()
    result = await client.health()
    return AIHealthStatus(**result)
