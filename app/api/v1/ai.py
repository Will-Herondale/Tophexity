"""AI test endpoint, AI health endpoint, and prompt management endpoints."""

import json

from fastapi import APIRouter, Depends, Request

from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.ai import PromptListResponse, PromptMetadata, PromptTestResponse
from app.services.ai.client import get_ai_client
from app.services.ai.exceptions import AIError
from app.services.ai.health import check_ai_health
from app.services.ai.models import AIHealthStatus
from app.services.ai.prompt_loader import (
    get_prompt_metadata,
    list_prompts,
    render_prompt,
)
from app.utils.exceptions import NotFoundException

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
    current_user: User = Depends(get_current_active_user),
):
    body = {}
    raw = await request.body()
    if raw:
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {}
    message = body.get("message", "Hello, this is a test message.")

    client = get_ai_client()
    try:
        response = await client.chat(
            messages=[{"role": "user", "content": message}],
            user_id=str(current_user.id),
            ip=request.client.host if request.client else None,
        )
    except AIError:
        raise
    except Exception as e:
        raise AIError(message=f"AI test failed: {str(e)[:200]}", status_code=503)

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


@router.get(
    "/prompts",
    summary="List all AI prompts",
    description="Return metadata for all available prompt templates including version, description, and token estimates.",
    tags=["AI"],
    response_model=PromptListResponse,
    responses={
        200: {"description": "Prompt list returned"},
    },
)
async def ai_list_prompts():
    names = list_prompts()
    items = []
    for name in names:
        try:
            meta = get_prompt_metadata(name)
            items.append(PromptMetadata(**meta))
        except FileNotFoundError:
            continue
    return PromptListResponse(prompts=items)


@router.post(
    "/prompts/{prompt_name}/test",
    summary="Test-render a prompt with variables",
    description=(
        "Render a prompt template with the provided variables and return the output. "
        "Useful for debugging prompt templates without sending to AI."
    ),
    tags=["AI"],
    response_model=PromptTestResponse,
    responses={
        200: {"description": "Rendered prompt returned"},
        404: {"description": "Prompt not found"},
    },
)
async def ai_test_prompt(
    prompt_name: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    body = {}
    raw = await request.body()
    if raw:
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {}
    variables = body.get("variables", {})
    try:
        rendered = render_prompt(prompt_name, variables)
    except FileNotFoundError:
        raise NotFoundException(detail=f"Prompt '{prompt_name}' not found")
    return PromptTestResponse(
        name=prompt_name,
        rendered=rendered,
        char_count=len(rendered),
        estimated_tokens=max(1, len(rendered) // 3),
    )
