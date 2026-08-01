"""Build context for AI requests from user data and conversation history.

Implements priority-based assembly with token budgeting and trimming.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.logging import logger
from app.models.backup import BackupPlan
from app.models.chat import ChatMessage, ChatSession
from app.models.portfolio import PortfolioItem
from app.models.profile import Profile
from app.models.recommendation import Recommendation
from app.models.roadmap import Roadmap
from app.models.user import User
from app.services.ai.context_cache import context_cache
from app.services.ai.prompt_cache import prompt_cache

settings = get_settings()


class ContextBuilder:
    """Assembles context for AI requests with priority-based token budgeting."""

    def __init__(self, db: AsyncSession, user: User) -> None:
        self.db = db
        self.user = user
        self._profile: dict | None = None
        self._portfolio: list[dict] = []
        self._recommendation: dict | None = None
        self._roadmap: dict | None = None
        self._backup: dict | None = None
        self._rag_context: str | None = None
        self._token_usage: dict = {}

    def estimate_tokens(self, text: str) -> int:
        """Conservative token estimate: 1 token ~ 3 characters."""
        return max(1, len(text) // 3) if text else 0

    def _calculate_budget(self) -> int:
        """Calculate available token budget for context (excludes response reserve)."""
        total = settings.AI_MAX_TOKENS
        response_reserve = int(total * settings.AI_CONTEXT_BUDGET_RESPONSE_PCT)
        return total - response_reserve

    def _reserve_for_messages(self) -> int:
        """Minimum tokens to reserve for recent messages."""
        budget = self._calculate_budget()
        return int(budget * settings.AI_CONTEXT_BUDGET_MESSAGES_PCT * 0.6)

    async def load_profile(self) -> dict:
        cached = context_cache.get(self.user.id, "profile")
        if cached is not None:
            self._profile = cached
            return self._profile

        result = await self.db.execute(
            select(Profile).where(Profile.user_id == self.user.id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            self._profile = {}
            context_cache.set(self.user.id, "profile", self._profile)
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
        context_cache.set(self.user.id, "profile", self._profile)
        return self._profile

    async def load_portfolio(self) -> list[dict]:
        cached = context_cache.get(self.user.id, "portfolio")
        if cached is not None:
            self._portfolio = cached
            return self._portfolio

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
        context_cache.set(self.user.id, "portfolio", self._portfolio)
        return self._portfolio

    async def load_latest_recommendation(self) -> dict | None:
        cached = context_cache.get(self.user.id, "recommendation")
        if cached is not None:
            self._recommendation = cached
            return self._recommendation

        result = await self.db.execute(
            select(Recommendation)
            .options(selectinload(Recommendation.items).selectinload(RecommendationItem.career))
            .where(Recommendation.user_id == self.user.id)
            .order_by(Recommendation.created_at.desc())
            .limit(1)
        )
        rec = result.unique().scalar_one_or_none()
        if not rec:
            self._recommendation = None
            context_cache.set(self.user.id, "recommendation", self._recommendation)
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
        context_cache.set(self.user.id, "recommendation", self._recommendation)
        return self._recommendation

    async def load_latest_roadmap(self) -> dict | None:
        cached = context_cache.get(self.user.id, "roadmap")
        if cached is not None:
            self._roadmap = cached
            return self._roadmap

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
            context_cache.set(self.user.id, "roadmap", self._roadmap)
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
        context_cache.set(self.user.id, "roadmap", self._roadmap)
        return self._roadmap

    async def load_latest_backup(self) -> dict | None:
        cached = context_cache.get(self.user.id, "backup")
        if cached is not None:
            self._backup = cached
            return self._backup

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
            context_cache.set(self.user.id, "backup", self._backup)
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
        context_cache.set(self.user.id, "backup", self._backup)
        return self._backup

    async def load_rag_context(self, query: str, max_tokens: int = 2000) -> str:
        """Retrieve relevant knowledge base context via semantic search."""
        try:
            from app.services.retrieval_engine import get_relevant_knowledge
            rag = await get_relevant_knowledge(
                self.db, query, max_tokens=max_tokens,
            )
            self._rag_context = rag or None
            return self._rag_context
        except Exception as e:
            logger.warning("RAG context load failed: %s", str(e)[:200])
            self._rag_context = None
            return ""

    async def load_all(self, user_message: str | None = None) -> dict:
        """Load all user context data sequentially. Individual failures are non-fatal.

        Note: Must run sequentially (not asyncio.gather) because all loaders share
        the same async DB session/connection. Concurrent queries on a single
        asyncpg connection raise InterfaceError.
        """
        loaders = {
            "profile": self.load_profile,
            "portfolio": self.load_portfolio,
            "latest_recommendation": self.load_latest_recommendation,
            "latest_roadmap": self.load_latest_roadmap,
            "latest_backup": self.load_latest_backup,
        }
        if user_message:
            loaders["rag_context"] = lambda: self.load_rag_context(user_message)
        defaults = {"profile": {}, "portfolio": []}

        results: dict = {}
        for key, fn in loaders.items():
            try:
                results[key] = await fn()
            except Exception as e:
                logger.warning("Context load failed for %s: %s", key, str(e)[:200])
                results[key] = defaults.get(key)

        return results

    def build_system_prompt(self, prompt_name: str = "system") -> str:
        """Load the system prompt and append user context."""
        base = prompt_cache.get(prompt_name)
        context = self.build_context_string()
        return f"{base}\n\n## User Context\n{context}"

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

        if self._rag_context:
            parts.append(f"Relevant Knowledge Base Context:\n{self._rag_context}")

        return "\n".join(parts) if parts else "No user data available."

    async def build_context(self, session: ChatSession) -> list[dict[str, str]]:
        """Build prioritized context messages within token budget."""
        messages = []
        token_budget = self._calculate_budget()
        used = 0

        # 1. System prompt (always, never trimmed)
        system_prompt = self.build_system_prompt("system")
        messages.append({"role": "system", "content": system_prompt})
        used += self.estimate_tokens(system_prompt)

        # 2. User profile (always if exists)
        if self._profile and self._profile.get("full_name"):
            profile_section = f"## User Profile\n{self._profile}"
            messages.append({"role": "system", "content": profile_section})
            used += self.estimate_tokens(profile_section)

        # 3. User facts (high priority)
        facts = (session.session_data or {}).get("facts", [])
        if facts:
            facts_text = "\n".join(
                f"- [{f.get('category', 'general')}] {f['fact']}" for f in facts
            )
            facts_section = f"## Known Facts About User\n{facts_text}"
            messages.append({"role": "system", "content": facts_section})
            used += self.estimate_tokens(facts_section)

        # 4. Conversation summary
        if session.summary:
            summary_section = f"## Conversation Summary\n{session.summary}"
            messages.append({"role": "system", "content": summary_section})
            used += self.estimate_tokens(summary_section)

        # 5. RAG context (high priority — retrieved from knowledge base)
        if self._rag_context:
            rag_section = f"## Relevant Knowledge Base\n{self._rag_context}"
            rag_tokens = self.estimate_tokens(rag_section)
            if used + rag_tokens <= token_budget - self._reserve_for_messages():
                messages.append({"role": "system", "content": rag_section})
                used += rag_tokens

        # 6-10. Lower priority sections (included if budget allows)
        remaining_sections = []
        if self._portfolio:
            remaining_sections.append(f"## Portfolio\n{self._portfolio}")
        if self._recommendation:
            remaining_sections.append(f"## Latest Recommendation\n{self._recommendation}")
        if self._roadmap:
            remaining_sections.append(f"## Latest Roadmap\n{self._roadmap}")
        if self._backup:
            remaining_sections.append(f"## Latest Backup Plan\n{self._backup}")

        for section in remaining_sections:
            section_tokens = self.estimate_tokens(section)
            if used + section_tokens <= token_budget - self._reserve_for_messages():
                messages.append({"role": "system", "content": section})
                used += section_tokens

        self._token_usage = {
            "total_budget": settings.AI_MAX_TOKENS,
            "available_budget": token_budget,
            "used_tokens": used,
            "remaining_tokens": token_budget - used,
        }

        return messages

    def get_token_usage_report(self) -> dict:
        """Return token usage report from last build_context call."""
        return self._token_usage

    @staticmethod
    def invalidate_user_cache(user_id) -> int:
        """Invalidate all cached context for a user. Call after mutations."""
        return context_cache.invalidate(user_id)
