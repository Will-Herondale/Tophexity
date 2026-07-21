from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()


class RecommendationClient:
    def __init__(self) -> None:
        self.service_url = settings.RECOMMENDATION_SERVICE_URL

    async def get_recommendations(self, user_profile: dict) -> list[dict]:
        logger.info("Recommendation client called")
        raise NotImplementedError("Recommendation service integration pending")

    async def generate_roadmap(self, career_path: dict) -> dict:
        logger.info("Roadmap generation called")
        raise NotImplementedError("Roadmap generation pending")

    async def generate_backup_plans(self, career_path: dict) -> list[dict]:
        logger.info("Backup plan generation called")
        raise NotImplementedError("Backup plan generation pending")


recommendation_client = RecommendationClient()
