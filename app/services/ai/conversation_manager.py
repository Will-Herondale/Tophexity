"""Conversation lifecycle management.

Manages creating, resuming, loading, and summarizing conversations.
Integrates with ChatSession/ChatMessage DB tables and AI memory system.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.logging import logger
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.services.ai.context_builder import ContextBuilder
from app.services.ai.memory import ConversationMemory
from app.services.ai.summarizer import summarize_messages
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
        """Load conversation memory from DB messages."""
        messages = [
            {"role": m.role.value if hasattr(m.role, "value") else str(m.role), "content": m.content}
            for m in session.messages
        ]

        # Check if messages exceed threshold; if so, summarize older ones
        if len(messages) > settings.AI_SUMMARY_THRESHOLD_MESSAGES:
            keep_recent = settings.AI_SUMMARY_KEEP_RECENT
            to_summarize = messages[:-keep_recent]
            recent = messages[-keep_recent:]

            summary = await summarize_messages(to_summarize, user_id=str(self.user.id))
            return ConversationMemory(
                recent_messages=recent,
                summary=summary,
                max_recent=settings.AI_MAX_CONTEXT_MESSAGES,
            )

        return ConversationMemory(
            recent_messages=messages,
            summary=None,
            max_recent=settings.AI_MAX_CONTEXT_MESSAGES,
        )

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
