from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionDetailResponse,
    ChatSessionListResponse,
    ChatSessionResponse,
)
from app.schemas.common import MessageResponse
from app.services import chat_service
from app.services.ai.client import get_ai_client
from app.services.ai.conversation_manager import ConversationManager

router = APIRouter()


@router.get("/health", summary="Chat service health check", tags=["Chat"])
async def chat_health():
    return {"status": "chat router active"}


@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=201,
    summary="Create chat session",
    description="Start a new AI chat session for career guidance.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def create_session(
    data: ChatSessionCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await chat_service.create_chat_session(db, current_user, data)


@router.get(
    "/sessions",
    response_model=ChatSessionListResponse,
    summary="List chat sessions",
    description="Retrieve all chat sessions for the authenticated user.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def list_sessions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await chat_service.list_chat_sessions(db, current_user, page, page_size)


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionDetailResponse,
    summary="Get chat session with messages",
    description="Retrieve a chat session with all its messages.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Session not found"},
    },
)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await chat_service.get_session_messages(db, current_user, session_id)


@router.post(
    "/sessions/{session_id}/messages",
    response_model=list[ChatMessageResponse],
    status_code=201,
    summary="Send message to AI chat",
    description=(
        "Send a user message to a chat session. The message is stored, "
        "context is built from the user's profile/portfolio/history, "
        "Azure AI generates a response, and both messages are returned."
    ),
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Session not found"},
        422: {"description": "Invalid role or empty content"},
        503: {"description": "AI service not configured"},
    },
)
async def add_messages(
    session_id: UUID,
    messages: list[ChatMessageCreate],
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    user_msgs = [m for m in messages if m.role == "user"]
    system_msgs = [m for m in messages if m.role == "system"]

    # Store all incoming messages first
    stored = await chat_service.add_messages(db, current_user, session_id, messages)

    # If there are user messages, generate AI response
    if user_msgs:
        client = get_ai_client()
        if client.is_configured:
            conv_manager = ConversationManager(db, current_user)
            session_obj = await conv_manager.get_session(session_id)

            last_user_msg = user_msgs[-1].content
            ai_messages = await conv_manager.build_ai_messages(
                session_obj, last_user_msg, prompt_name="chat",
            )

            response = await client.chat(
                messages=ai_messages,
                user_id=str(current_user.id),
                conversation_id=str(session_id),
                ip=request.client.host if request.client else None,
            )

            # Store assistant response
            assistant_msgs = await chat_service.add_messages(
                db, current_user, session_id,
                [ChatMessageCreate(role="assistant", content=response.content)],
            )
            stored.extend(assistant_msgs)

    return stored


@router.delete(
    "/sessions/{session_id}",
    response_model=MessageResponse,
    summary="Delete chat session",
    description="Delete a chat session and all its messages.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Session not found"},
    },
)
async def delete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    await chat_service.delete_chat_session(db, current_user, session_id)
    return MessageResponse(message="Chat session deleted")
