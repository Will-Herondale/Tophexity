import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func as sa_func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.core.config import get_settings
from app.core.logging import logger
from app.models.chat import ChatSession
from app.models.user import User
from app.schemas.chat import (
    ChatExportResponse,
    ChatHistoryResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatMessageUpdate,
    ChatSessionCreate,
    ChatSessionDetailResponse,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
    ChatStatsResponse,
    MemoryRebuildResponse,
)
from app.schemas.common import MessageResponse
from app.services import chat_service
from app.services.ai.client import get_ai_client
from app.services.ai.conversation_manager import ConversationManager
from app.services.ai.exceptions import AIError
from app.utils.exceptions import safe_flush

settings = get_settings()

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
    description="Retrieve chat sessions for the authenticated user with optional search and archive filter.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def list_sessions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str | None = Query(None, description="Search sessions by title"),
    is_archived: bool = Query(False, description="Filter by archived status"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await chat_service.list_chat_sessions(
        db, current_user, page, page_size, search=search, is_archived=is_archived,
    )


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


@router.get(
    "/sessions/{session_id}/messages",
    response_model=ChatHistoryResponse,
    summary="Get chat message history",
    description="Retrieve paginated message history for a chat session.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Session not found"},
    },
)
async def get_chat_history(
    session_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Messages per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await chat_service.get_chat_history(db, current_user, session_id, page, page_size)


@router.patch(
    "/sessions/{session_id}/messages/{message_id}",
    response_model=ChatMessageResponse,
    summary="Edit chat message",
    description="Update the content of a chat message.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Session or message not found"},
    },
)
async def update_message(
    session_id: UUID,
    message_id: UUID,
    data: ChatMessageUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await chat_service.update_chat_message(db, current_user, session_id, message_id, data)


@router.delete(
    "/sessions/{session_id}/messages/{message_id}",
    response_model=MessageResponse,
    summary="Delete chat message",
    description="Delete a single chat message from a session.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Session or message not found"},
    },
)
async def delete_message(
    session_id: UUID,
    message_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    await chat_service.delete_chat_message(db, current_user, session_id, message_id)
    return MessageResponse(message="Chat message deleted")


@router.patch(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse,
    summary="Update chat session",
    description="Update session title, pin, or archive status.",
    responses={
        400: {"description": "Invalid operation (e.g., pin archived session)"},
        401: {"description": "Not authenticated"},
        404: {"description": "Session not found"},
    },
)
async def update_session(
    session_id: UUID,
    data: ChatSessionUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await chat_service.update_chat_session(db, current_user, session_id, data)


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
    progress_token: str | None = Query(None, description="Optional token for polling progress via GET /intelligence/progress/{token}"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    from app.services.progress_store import ProgressReporter

    reporter = ProgressReporter(progress_token, str(current_user.id))
    user_msgs = [m for m in messages if m.role == "user"]

    stored = await chat_service.add_messages(db, current_user, session_id, messages)

    if user_msgs:
        client = get_ai_client()
        if client.is_configured:
            _step = ""
            try:
                reporter.report(15, "Preparing context", "Building conversation context")

                _step = "get_session"
                conv_manager = ConversationManager(db, current_user)
                session_obj = await conv_manager.get_session(session_id)

                _step = "build_ai_messages"
                last_user_msg = user_msgs[-1].content
                ai_messages = await conv_manager.build_ai_messages(
                    session_obj, last_user_msg, prompt_name="chat",
                )

                _step = "client.chat"
                reporter.report(40, "Analyzing with AI", "Thinking about your question — this usually takes 10-30 seconds")
                response = await client.chat(
                    messages=ai_messages,
                    user_id=str(current_user.id),
                    conversation_id=str(session_id),
                    ip=request.client.host if request.client else None,
                    max_tokens=settings.AI_CHAT_MAX_TOKENS,
                    reasoning_effort=settings.AI_REASONING_EFFORT,
                )

                _step = "store_assistant"
                assistant_stored = await chat_service.add_message_with_metadata(
                    db, current_user, session_id,
                    role="assistant",
                    content=response.content,
                    token_count=response.token_usage.total_tokens,
                    model_used=response.model,
                    latency_ms=response.latency_ms,
                    request_id=response.request_id,
                    message_data={
                        "finish_reason": response.finish_reason,
                        "prompt_tokens": response.token_usage.prompt_tokens,
                        "completion_tokens": response.token_usage.completion_tokens,
                    },
                )
                reporter.report(90, "Saving response", "Finishing up")
                stored.append(assistant_stored)

                _step = "count_msgs"
                from app.models.chat import ChatMessage as CM
                count_result = await db.execute(
                    select(sa_func.count()).select_from(CM).where(CM.session_id == session_id)
                )
                total_msg_count = count_result.scalar() or len(stored)

                _step = "update_metadata"
                await conv_manager.update_session_metadata(
                    session_obj,
                    total_tokens=response.token_usage.total_tokens,
                    prompt_tokens=response.token_usage.prompt_tokens,
                    completion_tokens=response.token_usage.completion_tokens,
                    model=response.model,
                )
                await safe_flush(db)

                reporter.report(100, "Done", "Response ready", status="succeeded")

                _step = "background_tasks"
                asyncio.create_task(
                    _background_tasks(session_id, current_user, user_msgs[0].content, total_msg_count)
                )
            except AIError:
                reporter.report(0, "Failed", "The AI service could not generate a response", status="failed")
                raise
            except Exception as e:
                reporter.report(0, "Failed", str(e)[:200], status="failed")
                logger.error("AI response generation failed at step '%s' for session %s: %s", _step, session_id, str(e)[:300])
                raise AIError(message=f"AI response generation failed", status_code=503)

    return stored


async def _background_tasks(
    session_id: UUID,
    user: User,
    first_message: str,
    total_msg_count: int,
) -> None:
    """Run title generation, summarization, and fact extraction in background."""
    from app.core.database import async_session_factory

    try:
        async with async_session_factory() as bg_db:
            bg_user = user
            bg_conv = ConversationManager(bg_db, bg_user)

            result = await bg_db.execute(
                select(ChatSession).where(ChatSession.id == session_id)
            )
            session_obj = result.scalar_one_or_none()
            if session_obj is None:
                logger.warning("Background tasks: session %s no longer exists", session_id)
                return

            # Title generation (first message only)
            if session_obj.title is None:
                await bg_conv.generate_title(session_obj, first_message)

            # Summarization (handled inside build_ai_messages -> load_memory)
            # Only run if threshold exceeded, to avoid re-summarizing on every message
            if total_msg_count > settings.AI_SUMMARY_THRESHOLD_MESSAGES:
                await bg_conv.load_memory(session_obj)

            # Fact extraction (every N messages)
            await bg_conv.maybe_extract_facts(session_obj, total_msg_count)

            await safe_flush(bg_db)
    except Exception as e:
        logger.warning("Background tasks failed for session %s: %s", session_id, str(e)[:200])


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


@router.post(
    "/sessions/{session_id}/rebuild-memory",
    response_model=MemoryRebuildResponse,
    summary="Rebuild conversation memory",
    description="Clear and regenerate the session's summary and extracted facts.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Session not found"},
    },
)
async def rebuild_memory(
    session_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    conv_manager = ConversationManager(db, current_user)
    session_obj = await conv_manager.get_session(session_id)
    try:
        result = await conv_manager.rebuild_memory(session_obj)
    except AIError:
        raise
    except Exception as e:
        logger.error("Memory rebuild failed for session %s: %s", session_id, str(e)[:300])
        raise AIError(message="Memory rebuild failed", status_code=503)
    return MemoryRebuildResponse(
        session_id=session_id,
        summary=result["summary"],
        summary_message_count=result["summary_message_count"],
        facts_count=result["facts_count"],
        message="Memory rebuilt successfully",
    )


@router.get(
    "/sessions/{session_id}/export",
    response_model=ChatExportResponse,
    summary="Export chat session",
    description="Export a chat session in JSON, Markdown, or plain text format.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Session not found"},
    },
)
async def export_session(
    session_id: UUID,
    format: str = Query("json", description="Export format: json, markdown, text"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    data = await chat_service.export_chat_session(db, current_user, session_id, format)
    return ChatExportResponse(**data)


@router.get(
    "/stats",
    response_model=ChatStatsResponse,
    summary="Get chat statistics",
    description="Get aggregate chat statistics for the authenticated user.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def chat_stats(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    data = await chat_service.get_chat_stats(db, current_user)
    return ChatStatsResponse(**data)
