from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    APP_NAME: str = "AI Career Path Creator"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/career_path"
    DATABASE_ECHO: bool = False

    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    AI_ENDPOINT: str = ""
    AI_API_KEY: str = ""
    AI_DEPLOYMENT_NAME: str = ""

    RECOMMENDATION_SERVICE_URL: str = "http://localhost:8001"

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
