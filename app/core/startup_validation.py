"""Startup validation — fail fast on bad configuration."""

from __future__ import annotations

import sys
from urllib.parse import urlparse

from app.core.logging import logger


def validate_settings() -> list[str]:
    """Validate all critical settings at startup. Returns list of errors (empty = OK)."""
    from app.core.config import get_settings

    settings = get_settings()
    errors: list[str] = []

    # Database URL
    db_url = settings.DATABASE_URL
    if not db_url or db_url.startswith("postgresql+asyncpg://user:pass@"):
        errors.append("DATABASE_URL is not configured (still default)")
    else:
        parsed = urlparse(db_url.replace("+asyncpg", ""))
        if not parsed.hostname:
            errors.append(f"DATABASE_URL has no hostname: {db_url[:60]}...")

    # JWT
    jwt_secret = settings.JWT_SECRET_KEY
    if not jwt_secret:
        errors.append("JWT_SECRET_KEY is empty")
    elif jwt_secret in ("CHANGE_ME_IN_PROD", "CHANGE_ME_IN_PRODUCTION", "CHANGE_ME"):
        errors.append("JWT_SECRET_KEY is still a placeholder value")
    elif len(jwt_secret) < 32:
        errors.append("JWT_SECRET_KEY is too short (< 32 chars) for production")

    # AI endpoint
    ai_ep = settings.AI_ENDPOINT
    if not ai_ep:
        errors.append("AI_ENDPOINT is empty")
    else:
        parsed = urlparse(ai_ep)
        if parsed.scheme not in ("http", "https"):
            errors.append(f"AI_ENDPOINT has invalid scheme: {ai_ep}")

    # AI deployment name
    if not settings.AI_DEPLOYMENT_NAME:
        errors.append("AI_DEPLOYMENT_NAME is empty")

    # Timeouts
    if settings.AI_REQUEST_TIMEOUT <= 0:
        errors.append(f"AI_REQUEST_TIMEOUT must be > 0, got {settings.AI_REQUEST_TIMEOUT}")
    if settings.AI_MAX_TOKENS <= 0:
        errors.append(f"AI_MAX_TOKENS must be > 0, got {settings.AI_MAX_TOKENS}")

    # Rate limits
    if settings.AI_RATE_LIMIT_PER_USER_PER_MINUTE <= 0:
        errors.append("AI_RATE_LIMIT_PER_USER_PER_MINUTE must be > 0")
    if settings.AI_RATE_LIMIT_PER_HOUR <= 0:
        errors.append("AI_RATE_LIMIT_PER_HOUR must be > 0")

    return errors


def validate_on_startup() -> None:
    """Run validation and log results. Called during app lifespan."""
    errors = validate_settings()

    if errors:
        logger.warning("Configuration issues found (%d):", len(errors))
        for err in errors:
            logger.warning("  - %s", err)
        logger.warning("Some features may not work correctly. Fix these before going to production.")
    else:
        logger.info("All configuration validated OK")


def fail_fast_validate() -> None:
    """Strict validation — exit on critical errors. Use in CI/CD."""
    errors = validate_settings()
    critical = [e for e in errors if any(k in e for k in ("DATABASE_URL", "JWT_SECRET_KEY"))]
    if critical:
        logger.error("CRITICAL configuration errors:")
        for err in critical:
            logger.error("  - %s", err)
        sys.exit(1)
