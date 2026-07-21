from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()


class AIClient:
    def __init__(self) -> None:
        self.endpoint = settings.AI_ENDPOINT
        self.api_key = settings.AI_API_KEY
        self.deployment = settings.AI_DEPLOYMENT_NAME

    async def chat(self, messages: list[dict], **kwargs) -> dict:
        logger.info("AI client chat called")
        raise NotImplementedError("AI client integration pending")

    async def generate(self, prompt: str, **kwargs) -> str:
        logger.info("AI client generate called")
        raise NotImplementedError("AI client integration pending")


ai_client = AIClient()
