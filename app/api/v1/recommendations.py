from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationListResponse,
    RecommendationResponse,
)
from app.services import recommendation_service

router = APIRouter()


@router.get("/health", summary="Recommendations service health check", tags=["Recommendations"])
async def recommendations_health():
    return {"status": "recommendations router active"}


@router.post(
    "",
    response_model=RecommendationResponse,
    status_code=201,
    summary="Create recommendation",
    description="Store a new career recommendation with ranked items. Each item must reference a valid career_id with a match_score between 0-100 and rank >= 1.",
    responses={
        401: {"description": "Not authenticated"},
        422: {"description": "Validation error"},
    },
)
async def create_recommendation(
    data: RecommendationCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await recommendation_service.create_recommendation(db, current_user, data)


@router.get(
    "/history",
    response_model=RecommendationListResponse,
    summary="List recommendation history",
    description="Retrieve all past recommendations for the authenticated user, sorted by most recent.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_recommendation_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await recommendation_service.list_recommendations(db, current_user, page, page_size)


@router.get(
    "/{recommendation_id}",
    response_model=RecommendationResponse,
    summary="Get recommendation details",
    description="Retrieve a specific recommendation with all its ranked career items.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Recommendation not found"},
    },
)
async def get_recommendation(
    recommendation_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await recommendation_service.get_recommendation(db, current_user, recommendation_id)
