"""Build context for AI requests from user data and conversation history."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.models.backup import BackupPlan
from app.models.chat import ChatMessage, ChatSession
from app.models.portfolio import PortfolioItem
from app.models.profile import Profile
from app.models.recommendation import Recommendation
from app.models.roadmap import Roadmap
from app.models.user import User
from app.services.ai.prompt_cache import prompt_cache


class ContextBuilder:
    """Assembles full context for AI requests."""

    def __init__(self, db: AsyncSession, user: User) -> None:
        self.db = db
        self.user = user
        self._profile: dict | None = None
        self._portfolio: list[dict] = []
        self._recommendation: dict | None = None
        self._roadmap: dict | None = None
        self._backup: dict | None = None

    async def load_profile(self) -> dict:
        result = await self.db.execute(
            select(Profile).where(Profile.user_id == self.user.id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            self._profile = {}
            return self._profile
        self._profile = {
            "full_name": profile.full_name,
            "headline": profile.headline,
            "bio": profile.bio,
            "location": profile.location,
            "education_level": profile.education_level,
            "years_experience": profile.years_experience,
            "current_field": profile.current_field,
            "target_fields": profile.target_fields,
            "skills": profile.skills,
            "interests": profile.interests,
        }
        return self._profile

    async def load_portfolio(self) -> list[dict]:
        result = await self.db.execute(
            select(PortfolioItem).where(
                PortfolioItem.user_id == self.user.id,
                PortfolioItem.deleted_at.is_(None),
            )
        )
        items = result.scalars().all()
        self._portfolio = [
            {
                "title": i.title,
                "description": i.description,
                "item_type": i.item_type,
                "skills_used": i.skills_used,
                "url": i.url,
            }
            for i in items
        ]
        return self._portfolio

    async def load_latest_recommendation(self) -> dict | None:
        result = await self.db.execute(
            select(Recommendation)
            .options(selectinload(Recommendation.items))
            .where(Recommendation.user_id == self.user.id)
            .order_by(Recommendation.created_at.desc())
            .limit(1)
        )
        rec = result.unique().scalar_one_or_none()
        if not rec:
            self._recommendation = None
            return None
        self._recommendation = {
            "title": rec.title,
            "summary": rec.summary,
            "status": str(rec.status.value) if rec.status else None,
            "items": [
                {
                    "career_id": str(i.career_id),
                    "match_score": float(i.match_score),
                    "reasoning": i.reasoning,
                    "rank": i.rank,
                }
                for i in rec.items
            ],
        }
        return self._recommendation

    async def load_latest_roadmap(self) -> dict | None:
        result = await self.db.execute(
            select(Roadmap)
            .options(selectinload(Roadmap.steps))
            .where(Roadmap.user_id == self.user.id)
            .order_by(Roadmap.created_at.desc())
            .limit(1)
        )
        rm = result.unique().scalar_one_or_none()
        if not rm:
            self._roadmap = None
            return None
        self._roadmap = {
            "title": rm.title,
            "description": rm.description,
            "status": str(rm.status.value) if rm.status else None,
            "estimated_duration_months": rm.estimated_duration_months,
            "steps": [
                {
                    "title": s.title,
                    "description": s.description,
                    "step_order": s.step_order,
                    "duration_months": s.duration_months,
                    "resources": s.resources,
                }
                for s in rm.steps
            ],
        }
        return self._roadmap

    async def load_latest_backup(self) -> dict | None:
        result = await self.db.execute(
            select(BackupPlan)
            .options(selectinload(BackupPlan.scenarios))
            .where(BackupPlan.user_id == self.user.id)
            .order_by(BackupPlan.created_at.desc())
            .limit(1)
        )
        bp = result.unique().scalar_one_or_none()
        if not bp:
            self._backup = None
            return None
        self._backup = {
            "title": bp.title,
            "description": bp.description,
            "status": str(bp.status.value) if bp.status else None,
            "scenarios": [
                {
                    "scenario_name": s.scenario_name,
                    "description": s.description,
                    "transition_difficulty": s.transition_difficulty,
                    "estimated_transition_months": s.estimated_transition_months,
                    "reasoning": s.reasoning,
                }
                for s in bp.scenarios
            ],
        }
        return self._backup

    async def load_all(self) -> dict:
        """Load all user context data."""
        await self.load_profile()
        await self.load_portfolio()
        await self.load_latest_recommendation()
        await self.load_latest_roadmap()
        await self.load_latest_backup()
        return {
            "profile": self._profile,
            "portfolio": self._portfolio,
            "latest_recommendation": self._recommendation,
            "latest_roadmap": self._roadmap,
            "latest_backup": self._backup,
        }

    def build_context_string(self) -> str:
        """Build a formatted context string for inclusion in prompts."""
        parts = []

        if self._profile and self._profile.get("full_name"):
            parts.append(f"User Profile: {self._profile}")

        if self._portfolio:
            parts.append(f"Portfolio ({len(self._portfolio)} items): {self._portfolio}")

        if self._recommendation:
            parts.append(f"Latest Recommendation: {self._recommendation}")

        if self._roadmap:
            parts.append(f"Latest Roadmap: {self._roadmap}")

        if self._backup:
            parts.append(f"Latest Backup Plan: {self._backup}")

        return "\n".join(parts) if parts else "No user data available."

    def build_system_prompt(self, prompt_name: str = "system") -> str:
        """Load the system prompt and append user context."""
        base = prompt_cache.get(prompt_name)
        context = self.build_context_string()
        return f"{base}\n\n## User Context\n{context}"
