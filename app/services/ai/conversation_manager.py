"""Conversation lifecycle management.

Manages creating, resuming, loading, and summarizing conversations.
Integrates with ChatSession/ChatMessage DB tables and AI memory system.
Supports persistent summary storage, incremental summarization, and fact extraction.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.logging import logger
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.services.ai.client import get_ai_client
from app.services.ai.context_builder import ContextBuilder
from app.services.ai.fact_extractor import dedup_facts, extract_facts
from app.services.ai.memory import ConversationMemory
from app.services.ai.prompt_loader import render_prompt
from app.services.ai.response_parser import clean_response_content
from app.services.ai.summarizer import (
    merge_summaries,
    summarize_delta,
    summarize_messages,
    validate_summary,
)
from app.utils.exceptions import NotFoundException

settings = get_settings()


class ConversationManager:
    def __init__(self, db: AsyncSession, user: User) -> None:
        self.db = db
        self.user = user

    async def get_session(self, session_id: UUID) -> ChatSession:
        result = await self.db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.id == session_id, ChatSession.user_id == self.user.id)
        )
        session = result.unique().scalar_one_or_none()
        if not session:
            raise NotFoundException(detail="Chat session not found")
        return session

    async def load_memory(self, session: ChatSession) -> ConversationMemory:
        """Load conversation memory from persistent summary + recent messages."""
        total_messages = len(session.messages)
        recent_count = min(total_messages, settings.AI_MAX_CONTEXT_MESSAGES)
        recent = [
            {"role": m.role.value if hasattr(m.role, "value") else str(m.role), "content": m.content}
            for m in session.messages[-recent_count:]
        ]

        memory = ConversationMemory(
            recent_messages=recent,
            summary=session.summary,
            max_recent=settings.AI_MAX_CONTEXT_MESSAGES,
        )

        # Check if summarization is needed
        if session.summary_message_count == 0:
            # First-time summarization
            if total_messages > settings.AI_SUMMARY_THRESHOLD_MESSAGES:
                keep = settings.AI_SUMMARY_KEEP_RECENT
                to_summarize = [
                    {"role": m.role.value if hasattr(m.role, "value") else str(m.role), "content": m.content}
                    for m in session.messages[:-keep]
                ]
                summary = await summarize_messages(to_summarize, user_id=str(self.user.id))
                validated = validate_summary(summary, session.summary)
                if validated:
                    session.summary = validated
                    session.summary_updated_at = datetime.now(timezone.utc)
                    session.summary_message_count = total_messages - keep
                    memory.summary = validated
        else:
            # Incremental summarization
            unsummarized = total_messages - session.summary_message_count
            if unsummarized > settings.AI_SUMMARY_THRESHOLD_MESSAGES:
                keep = settings.AI_SUMMARY_KEEP_RECENT
                start_idx = session.summary_message_count
                end_idx = total_messages - keep
                delta_msgs = [
                    {"role": m.role.value if hasattr(m.role, "value") else str(m.role), "content": m.content}
                    for m in session.messages[start_idx:end_idx]
                ]
                delta_summary = await summarize_delta(delta_msgs, user_id=str(self.user.id))
                if delta_summary:
                    combined = merge_summaries(session.summary, delta_summary)
                    validated = validate_summary(combined, session.summary)
                    if validated:
                        session.summary = validated
                        session.summary_updated_at = datetime.now(timezone.utc)
                        session.summary_message_count = total_messages - keep
                        memory.summary = validated

        return memory

    async def maybe_extract_facts(self, session: ChatSession, total_messages: int) -> None:
        """Extract facts from recent messages if interval is met."""
        if total_messages % settings.AI_FACT_EXTRACTION_INTERVAL != 0:
            return
        if total_messages < settings.AI_FACT_EXTRACTION_INTERVAL:
            return

        recent_msgs = [
            {"role": m.role.value if hasattr(m.role, "value") else str(m.role), "content": m.content}
            for m in session.messages[-settings.AI_FACT_EXTRACTION_INTERVAL:]
        ]
        new_facts = await extract_facts(recent_msgs, user_id=str(self.user.id))
        if not new_facts:
            return

        data = session.session_data or {}
        existing_facts = data.get("facts", [])
        merged = dedup_facts(existing_facts, new_facts)
        if len(merged) > len(existing_facts):
            data["facts"] = merged
            session.session_data = data
            logger.info("Added %d new facts to session %s", len(merged) - len(existing_facts), session.id)

    async def update_session_metadata(
        self,
        session: ChatSession,
        total_tokens: int = 0,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        model: str | None = None,
    ) -> None:
        """Update session metadata counters after a message exchange."""
        data = session.session_data or {}
        data["message_count"] = data.get("message_count", 0) + 2  # user + assistant
        data["user_message_count"] = data.get("user_message_count", 0) + 1
        data["assistant_message_count"] = data.get("assistant_message_count", 0) + 1
        data["total_tokens_used"] = data.get("total_tokens_used", 0) + total_tokens
        data["total_prompt_tokens"] = data.get("total_prompt_tokens", 0) + prompt_tokens
        data["total_completion_tokens"] = data.get("total_completion_tokens", 0) + completion_tokens
        data["last_message_at"] = datetime.now(timezone.utc).isoformat()
        if model:
            data["last_model"] = model
        session.session_data = data

    async def build_ai_messages(
        self,
        session: ChatSession,
        user_message: str,
        prompt_name: str = "system",
    ) -> list[dict[str, str]]:
        """Build full AI message list: system prompt + context + memory + user message."""
        ctx = ContextBuilder(self.db, self.user)
        await ctx.load_all()
        system_prompt = ctx.build_system_prompt(prompt_name)

        memory = await self.load_memory(session)
        memory.add_message("user", user_message)

        return memory.build_messages_for_ai(system_prompt)

    async def store_exchange(
        self,
        session: ChatSession,
        user_message: str,
        assistant_response: str,
    ) -> tuple[ChatMessage, ChatMessage]:
        """Store user message and assistant response in DB."""
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=assistant_response,
        )
        self.db.add(user_msg)
        self.db.add(assistant_msg)
        await self.db.flush()
        return user_msg, assistant_msg

    async def generate_title(self, session: ChatSession, first_message: str) -> str | None:
        """Generate a title for a session based on the first user message."""
        if not settings.AI_TITLE_GENERATION_ENABLED:
            return None
        if session.title is not None:
            return None

        client = get_ai_client()
        if not client.is_configured:
            return self._fallback_title(first_message)

        try:
            system_prompt = render_prompt(
                "title_generation", {"first_message": first_message[:500]}
            )
            response = await client.chat(
                messages=[{"role": "user", "content": system_prompt}],
                temperature=0.3,
                max_tokens=100,
                user_id=str(self.user.id),
            )
            title = clean_response_content(response.content).strip()
            # Enforce max length
            if len(title) > settings.AI_TITLE_MAX_LENGTH:
                title = title[: settings.AI_TITLE_MAX_LENGTH]
            if title:
                session.title = title
                data = session.session_data or {}
                data["title_auto_generated"] = True
                session.session_data = data
                return title
        except Exception as e:
            logger.warning("Title generation failed: %s", str(e)[:200])

        fallback = self._fallback_title(first_message)
        session.title = fallback
        return fallback

    def _fallback_title(self, message: str) -> str:
        """Generate a fallback title from the first message."""
        truncated = message[:50].strip()
        if len(message) > 50:
            truncated += "..."
        return f"Chat - {truncated}"

    async def rebuild_memory(self, session: ChatSession) -> dict:
        """Clear and regenerate summary and facts for a session."""
        session.summary = None
        session.summary_updated_at = None
        session.summary_message_count = 0
        data = session.session_data or {}
        data["facts"] = []
        session.session_data = data

        # Reload messages into session
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at)
        )
        messages = result.scalars().all()
        session.messages = list(messages)

        # Re-run summarization if enough messages
        if len(messages) > settings.AI_SUMMARY_THRESHOLD_MESSAGES:
            memory = await self.load_memory(session)
        else:
            memory = await self.load_memory(session)

        # Re-run fact extraction
        await self.maybe_extract_facts(session, len(messages))

        await self.db.flush()

        facts = (session.session_data or {}).get("facts", [])
        return {
            "summary": session.summary,
            "summary_message_count": session.summary_message_count,
            "facts_count": len(facts),
        }
