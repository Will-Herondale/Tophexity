from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.roadmap import (
    RoadmapCreate,
    RoadmapListResponse,
    RoadmapResponse,
)
from app.services import roadmap_service

router = APIRouter()


@router.get("/health", summary="Roadmaps service health check", tags=["Roadmaps"])
async def roadmaps_health():
    return {"status": "roadmaps router active"}


@router.post(
    "",
    response_model=RoadmapResponse,
    status_code=201,
    summary="Create learning roadmap",
    description="Store a new career learning roadmap with ordered steps. Must reference a valid career_id. Steps must have unique step_order values starting from 1.",
    responses={
        401: {"description": "Not authenticated"},
        422: {"description": "Validation error"},
    },
)
async def create_roadmap(
    data: RoadmapCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await roadmap_service.create_roadmap(db, current_user, data)


@router.get(
    "/history",
    response_model=RoadmapListResponse,
    summary="List roadmap history",
    description="Retrieve all past roadmaps for the authenticated user, sorted by most recent.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_roadmap_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await roadmap_service.list_roadmaps(db, current_user, page, page_size)


@router.get(
    "/{roadmap_id}",
    response_model=RoadmapResponse,
    summary="Get roadmap details",
    description="Retrieve a specific roadmap with all its ordered learning steps.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Roadmap not found"},
    },
)
async def get_roadmap(
    roadmap_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await roadmap_service.get_roadmap(db, current_user, roadmap_id)
