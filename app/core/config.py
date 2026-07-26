import secrets
import os
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

    JWT_SECRET_KEY: str = secrets.token_urlsafe(64)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080

    AI_ENDPOINT: str = "https://tophex.cognitiveservices.azure.com/"
    AI_API_KEY: str = ""
    AI_DEPLOYMENT_NAME: str = "gpt-5"
    AI_API_VERSION: str = "2024-12-01-preview"
    AI_FOUNDRY_PROJECT_URL: str = "https://tophex.services.ai.azure.com/api/projects/proj-tophex"

    AI_MAX_RETRIES: int = 3
    AI_RETRY_BASE_DELAY: float = 1.0
    AI_RETRY_MAX_DELAY: float = 30.0
    AI_REQUEST_TIMEOUT: float = 300.0
    AI_MAX_TOKENS: int = 16384
    AI_TEMPERATURE: float = 0.7

    AI_RATE_LIMIT_PER_MINUTE: int = 50
    AI_RATE_LIMIT_PER_HOUR: int = 500
    AI_RATE_LIMIT_PER_USER_PER_MINUTE: int = 25
    AI_RATE_LIMIT_PER_IP_PER_MINUTE: int = 60
    AI_RATE_LIMIT_PER_CONVERSATION_PER_MINUTE: int = 30
    AI_RATE_LIMIT_PER_USER_PER_DAY: int = 5000

    AI_SUMMARY_THRESHOLD_MESSAGES: int = 30
    AI_SUMMARY_KEEP_RECENT: int = 15
    AI_MAX_CONTEXT_MESSAGES: int = 100

    # Phase 3.2A — Conversation Platform
    AI_CONVERSATION_RETENTION_DAYS: int = 180
    AI_CONVERSATION_ARCHIVE_AFTER_DAYS: int = 60
    AI_MAX_CONVERSATIONS_PER_USER: int = 500

    AI_TITLE_GENERATION_ENABLED: bool = True
    AI_TITLE_GENERATION_TIMEOUT: float = 5.0
    AI_TITLE_MAX_LENGTH: int = 120

    AI_MAX_SUMMARY_LENGTH: int = 5000
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
    LOG_JSON_MODE: bool = False

    @property
    def jwt_secret_is_default(self) -> bool:
        return self.JWT_SECRET_KEY == "CHANGE_ME_IN_PRODUCTION"

    # Circuit breaker
    AI_CIRCUIT_BREAKER_THRESHOLD: int = 10
    AI_CIRCUIT_BREAKER_TIMEOUT: float = 90.0

    # Security
    AI_MAX_INPUT_TOKENS: int = 32000
    AI_PROMPT_INJECTION_ENABLED: bool = True
    AI_JAILBREAK_DETECTION_ENABLED: bool = True

    # Admin
    ADMIN_API_ENABLED: bool = True


def _set_if_missing(target: str, aliases: tuple[str, ...]) -> None:
    if os.environ.get(target):
        return
    for alias in aliases:
        value = os.environ.get(alias)
        if value:
            os.environ[target] = value
            return


def _load_ai_env_aliases() -> None:
    _set_if_missing("AI_ENDPOINT", ("OPENAI_ENDPOINT", "AZURE_OPENAI_ENDPOINT"))
    _set_if_missing("AI_API_KEY", ("OPENAI_API_KEY", "AZURE_OPENAI_API_KEY"))
    _set_if_missing(
        "AI_DEPLOYMENT_NAME",
        ("OPENAI_DEPLOYMENT", "AZURE_OPENAI_DEPLOYMENT", "AZURE_OPENAI_DEPLOYMENT_NAME"),
    )
    _set_if_missing("AI_API_VERSION", ("OPENAI_API_VERSION", "AZURE_OPENAI_API_VERSION"))


def _load_api_key_into_env() -> None:
    """Read api_key.txt and set AI_API_KEY env var if not already set."""
    if os.environ.get("AI_API_KEY"):
        return

    api_key_path = Path(__file__).resolve().parent.parent.parent / "api_key.txt"
    if not api_key_path.exists():
        return

    key = api_key_path.read_text().strip()
    if not key:
        return

    os.environ["AI_API_KEY"] = key


_load_ai_env_aliases()
_load_api_key_into_env()


@lru_cache
def get_settings() -> Settings:
    return Settings()
