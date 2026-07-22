from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    APP_NAME: str = "AI Career Path Creator"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/v1"

    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/career_path"
    DATABASE_ECHO: bool = False

    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080

    AI_ENDPOINT: str = "https://tophex.openai.azure.com/openai/v1"
    AI_API_KEY: str = ""
    AI_DEPLOYMENT_NAME: str = "gpt-5"
    AI_API_VERSION: str = "2024-12-01-preview"
    AI_FOUNDRY_PROJECT_URL: str = "https://tophex.services.ai.azure.com/api/projects/proj-tophex"

    AI_MAX_RETRIES: int = 3
    AI_RETRY_BASE_DELAY: float = 1.0
    AI_RETRY_MAX_DELAY: float = 30.0
    AI_REQUEST_TIMEOUT: float = 60.0
    AI_MAX_TOKENS: int = 4096
    AI_TEMPERATURE: float = 0.7

    AI_RATE_LIMIT_PER_MINUTE: int = 20
    AI_RATE_LIMIT_PER_HOUR: int = 200
    AI_RATE_LIMIT_PER_USER_PER_MINUTE: int = 10
    AI_RATE_LIMIT_PER_IP_PER_MINUTE: int = 30
    AI_RATE_LIMIT_PER_CONVERSATION_PER_MINUTE: int = 15

    AI_SUMMARY_THRESHOLD_MESSAGES: int = 20
    AI_SUMMARY_KEEP_RECENT: int = 10
    AI_MAX_CONTEXT_MESSAGES: int = 50

    # Phase 3.2A — Conversation Platform
    AI_CONVERSATION_RETENTION_DAYS: int = 90
    AI_CONVERSATION_ARCHIVE_AFTER_DAYS: int = 30
    AI_MAX_CONVERSATIONS_PER_USER: int = 100

    AI_TITLE_GENERATION_ENABLED: bool = True
    AI_TITLE_GENERATION_TIMEOUT: float = 3.0
    AI_TITLE_MAX_LENGTH: int = 80

    AI_MAX_SUMMARY_LENGTH: int = 2000
    AI_FACT_EXTRACTION_INTERVAL: int = 5
    AI_MIN_RECENT_MESSAGES: int = 4

    AI_CONTEXT_BUDGET_SYSTEM_PCT: float = 0.15
    AI_CONTEXT_BUDGET_SUMMARY_PCT: float = 0.10
    AI_CONTEXT_BUDGET_FACTS_PCT: float = 0.05
    AI_CONTEXT_BUDGET_MESSAGES_PCT: float = 0.50
    AI_CONTEXT_BUDGET_RESPONSE_PCT: float = 0.20

    AI_PROMPT_CACHE_TTL: float = 300.0
    AI_PROMPT_DEBUG_ENABLED: bool = True

    RECOMMENDATION_SERVICE_URL: str = "http://localhost:8001"

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    LOG_LEVEL: str = "INFO"


def _load_api_key_into_env() -> None:
    """Read api_key.txt and set AI_API_KEY env var if not already set."""
    import os

    if os.environ.get("AI_API_KEY"):
        return

    api_key_path = Path(__file__).resolve().parent.parent.parent / "api_key.txt"
    if not api_key_path.exists():
        return

    key = api_key_path.read_text().strip()
    if not key:
        return

    os.environ["AI_API_KEY"] = key


_load_api_key_into_env()


@lru_cache
def get_settings() -> Settings:
    return Settings()
