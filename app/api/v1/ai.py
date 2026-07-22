"""AI test endpoint and AI health endpoint."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.services.ai.client import get_ai_client
from app.services.ai.health import check_ai_health
from app.services.ai.models import AIHealthStatus

router = APIRouter()


@router.post(
    "/test",
    summary="Test AI integration",
    description=(
        "Send a simple message to Azure AI and return the response. "
        "This endpoint is for backend verification only and is not intended "
        "for production frontend usage."
    ),
    tags=["AI"],
    responses={
        200: {"description": "AI response returned successfully"},
        503: {"description": "AI service not configured or unavailable"},
    },
)
async def ai_test(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    body = await request.json()
    message = body.get("message", "Hello, this is a test message.")

    client = get_ai_client()
    response = await client.chat(
        messages=[{"role": "user", "content": message}],
        user_id=str(current_user.id),
        ip=request.client.host if request.client else None,
    )

    return {
        "response": response.content,
        "model": response.model,
        "tokens": response.token_usage.total_tokens,
        "latency_ms": round(response.latency_ms, 1),
        "request_id": response.request_id,
    }


@router.get(
    "/health",
    summary="AI health check",
    description=(
        "Verify Azure AI connectivity, deployment, authentication, and latency. "
        "Returns detailed diagnostics."
    ),
    tags=["AI"],
    response_model=AIHealthStatus,
    responses={
        200: {"description": "Health check completed"},
    },
)
async def ai_health():
    return await check_ai_health()
