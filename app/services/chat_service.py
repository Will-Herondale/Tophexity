import math
from uuid import UUID

from sqlalchemy import select, func
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
)
from app.utils.exceptions import NotFoundException


async def create_chat_session(
    db: AsyncSession, user: User, data: ChatSessionCreate
) -> ChatSessionResponse:
    session = ChatSession(user_id=user.id, title=data.title)
    db.add(session)
    await db.flush()
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
    await db.flush()
    return [ChatMessageResponse.model_validate(m) for m in created]


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
    return ChatSessionDetailResponse(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        created_at=session.created_at,
        messages=[ChatMessageResponse.model_validate(m) for m in session.messages],
    )


async def list_chat_sessions(
    db: AsyncSession, user: User, page: int = 1, page_size: int = 20
) -> ChatSessionListResponse:
    count_query = select(func.count(ChatSession.id)).where(ChatSession.user_id == user.id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    query = (
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
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
    await db.flush()
