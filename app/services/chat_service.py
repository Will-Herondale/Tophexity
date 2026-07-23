import math
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionDetailResponse,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
)
from app.utils.exceptions import BadRequestException, NotFoundException, safe_flush


async def create_chat_session(
    db: AsyncSession, user: User, data: ChatSessionCreate
) -> ChatSessionResponse:
    session = ChatSession(user_id=user.id, title=data.title)
    db.add(session)
    await safe_flush(db)
    return ChatSessionResponse.model_validate(session)


async def add_messages(
    db: AsyncSession, user: User, session_id: UUID, messages: list[ChatMessageCreate]
) -> list[ChatMessageResponse]:
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.user_id == user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundException(detail="Chat session not found")
    created = []
    for msg_data in messages:
        msg = ChatMessage(
            session_id=session.id,
            role=msg_data.role,
            content=msg_data.content,
        )
        db.add(msg)
        created.append(msg)
    await safe_flush(db)
    return [ChatMessageResponse.model_validate(m) for m in created]


async def add_message_with_metadata(
    db: AsyncSession,
    user: User,
    session_id: UUID,
    role: str,
    content: str,
    token_count: int | None = None,
    model_used: str | None = None,
    latency_ms: float | None = None,
    request_id: str | None = None,
    message_data: dict | None = None,
) -> ChatMessageResponse:
    """Store a single message with optional AI metadata."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.user_id == user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundException(detail="Chat session not found")

    msg = ChatMessage(
        session_id=session.id,
        role=role,
        content=content,
        token_count=token_count,
        model_used=model_used,
        latency_ms=latency_ms,
        request_id=request_id,
        message_data=message_data or {},
    )
    db.add(msg)
    await safe_flush(db)
    return ChatMessageResponse.model_validate(msg)


async def get_session_messages(
    db: AsyncSession, user: User, session_id: UUID
) -> ChatSessionDetailResponse:
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == user.id)
    )
    session = result.unique().scalar_one_or_none()
    if not session:
        raise NotFoundException(detail="Chat session not found")
    return ChatSessionDetailResponse.model_validate(session)


async def update_chat_session(
    db: AsyncSession, user: User, session_id: UUID, data: ChatSessionUpdate
) -> ChatSessionResponse:
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.user_id == user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundException(detail="Chat session not found")

    now = datetime.now(timezone.utc)

    # Validate pin/archive conflicts
    if data.is_pinned is True and session.is_archived:
        raise BadRequestException(detail="Cannot pin an archived session. Restore it first.")
    if data.is_archived is True and session.is_pinned:
        raise BadRequestException(detail="Cannot archive a pinned session. Unpin it first.")

    if data.title is not None:
        session.title = data.title
    if data.is_pinned is not None:
        session.is_pinned = data.is_pinned
        session.pinned_at = now if data.is_pinned else None
    if data.is_archived is not None:
        session.is_archived = data.is_archived
        session.archived_at = now if data.is_archived else None

    await safe_flush(db)
    return ChatSessionResponse.model_validate(session)


async def list_chat_sessions(
    db: AsyncSession,
    user: User,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    is_archived: bool = False,
) -> ChatSessionListResponse:
    base_filter = [
        ChatSession.user_id == user.id,
        ChatSession.is_archived == is_archived,
    ]

    if search:
        search_pattern = f"%{search}%"
        base_filter.append(
            or_(
                ChatSession.title.ilike(search_pattern),
            )
        )

    count_query = select(func.count(ChatSession.id)).where(*base_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    query = (
        select(ChatSession)
        .where(*base_filter)
        .order_by(ChatSession.is_pinned.desc(), ChatSession.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    sessions = [ChatSessionResponse.model_validate(s) for s in result.scalars().all()]
    return ChatSessionListResponse(
        items=sessions, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def delete_chat_session(
    db: AsyncSession, user: User, session_id: UUID
) -> None:
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.user_id == user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundException(detail="Chat session not found")
    msg_result = await db.execute(
        select(ChatMessage).where(ChatMessage.session_id == session.id)
    )
    for msg in msg_result.scalars().all():
        await db.delete(msg)
    await db.delete(session)
    await safe_flush(db)


async def export_chat_session(
    db: AsyncSession, user: User, session_id: UUID, fmt: str = "json"
) -> dict:
    """Export a chat session in the specified format."""
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == user.id)
    )
    session = result.unique().scalar_one_or_none()
    if not session:
        raise NotFoundException(detail="Chat session not found")

    messages = []
    for m in session.messages:
        msg_dict = {
            "role": m.role.value if hasattr(m.role, "value") else str(m.role),
            "content": m.content,
            "timestamp": m.created_at.isoformat() if m.created_at else None,
        }
        if m.model_used:
            msg_dict["model"] = m.model_used
        if m.token_count:
            msg_dict["tokens"] = m.token_count
        messages.append(msg_dict)

    return {
        "session": {
            "id": str(session.id),
            "title": session.title,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "message_count": len(messages),
        },
        "summary": session.summary,
        "messages": messages,
    }


async def get_chat_stats(
    db: AsyncSession, user: User
) -> dict:
    """Get aggregate chat statistics for a user."""
    # Total sessions
    total_result = await db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.user_id == user.id)
    )
    total_sessions = total_result.scalar() or 0

    # Active sessions
    active_result = await db.execute(
        select(func.count(ChatSession.id)).where(
            ChatSession.user_id == user.id,
            ChatSession.is_archived == False,
        )
    )
    active_sessions = active_result.scalar() or 0

    # Archived sessions
    archived_sessions = total_sessions - active_sessions

    # Total messages
    msg_count_result = await db.execute(
        select(func.count(ChatMessage.id))
        .join(ChatSession, ChatSession.id == ChatMessage.session_id)
        .where(ChatSession.user_id == user.id)
    )
    total_messages = msg_count_result.scalar() or 0

    # Total tokens from session_data
    sessions_result = await db.execute(
        select(ChatSession.session_data).where(ChatSession.user_id == user.id)
    )
    total_tokens = 0
    for (data,) in sessions_result.all():
        if data:
            total_tokens += data.get("total_tokens_used", 0)

    # Estimated cost (rough: $0.03 per 1K tokens)
    estimated_cost = round(total_tokens * 0.00003, 4)

    # Average messages per session
    avg_msgs = round(total_messages / total_sessions, 1) if total_sessions > 0 else 0

    # First and last conversation
    first_result = await db.execute(
        select(func.min(ChatSession.created_at)).where(ChatSession.user_id == user.id)
    )
    first_at = first_result.scalar()

    last_result = await db.execute(
        select(func.max(ChatSession.updated_at)).where(ChatSession.user_id == user.id)
    )
    last_at = last_result.scalar()

    return {
        "total_sessions": total_sessions,
        "active_sessions": active_sessions,
        "archived_sessions": archived_sessions,
        "total_messages": total_messages,
        "total_tokens_used": total_tokens,
        "estimated_total_cost_usd": estimated_cost,
        "average_messages_per_session": avg_msgs,
        "first_conversation_at": first_at.isoformat() if first_at else None,
        "last_conversation_at": last_at.isoformat() if last_at else None,
    }
