from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.career import (
    CareerCreate,
    CareerDetailResponse,
    CareerImportRequest,
    CareerImportResponse,
    CareerListResponse,
    CareerResponse,
    CareerUpdate,
)
from app.schemas.common import MessageResponse
from app.services import career_service

router = APIRouter()


@router.get("/health", summary="Careers service health check", tags=["Careers"])
async def careers_health():
    return {"status": "careers router active"}


@router.post(
    "/import",
    response_model=CareerImportResponse,
    status_code=201,
    summary="Import careers in bulk",
    description="Bulk import career entries with related skills, degrees, colleges, exams, scholarships, and resources. Duplicate careers (by title) are skipped.",
    responses={
        401: {"description": "Not authenticated"},
        422: {"description": "Validation error"},
    },
)
async def import_careers(
    data: CareerImportRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await career_service.import_careers(db, data)


@router.get(
    "",
    response_model=CareerListResponse,
    summary="Search and filter careers",
    description="Search careers by text, filter by skill, degree level, demand level, and salary range. Returns paginated results sorted by title.",
    responses={},
)
async def search_careers(
    search: str | None = Query(None, description="Full-text search in title and description"),
    skill: str | None = Query(None, description="Filter by skill name"),
    degree_level: str | None = Query(None, description="Filter by degree level (bachelor, master, etc.)"),
    demand_level: str | None = Query(None, description="Filter by demand level (high, very_high, etc.)"),
    min_salary: float | None = Query(None, description="Minimum average salary filter"),
    max_salary: float | None = Query(None, description="Maximum average salary filter"),
    sort_by: str = Query("title", description="Sort field: title, average_salary, created_at"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
):
    return await career_service.search_careers(
        db, search, skill, degree_level, demand_level,
        min_salary, max_salary, sort_by, sort_order, page, page_size
    )


@router.get(
    "/{career_id}",
    response_model=CareerDetailResponse,
    summary="Get career details",
    description="Retrieve full career details including all related skills, degrees, colleges, exams, scholarships, and resources.",
    responses={
        404: {"description": "Career not found"},
    },
)
async def get_career(
    career_id: UUID,
    db: AsyncSession = Depends(get_db_session),
):
    return await career_service.get_career_detail(db, career_id)


@router.put(
    "/{career_id}",
    response_model=CareerResponse,
    summary="Update career",
    description="Update a career entry's basic fields (title, description, salary, etc.).",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Career not found"},
    },
)
async def update_career(
    career_id: UUID,
    data: CareerUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await career_service.update_career(db, career_id, data)


@router.delete(
    "/{career_id}",
    response_model=MessageResponse,
    summary="Delete career",
    description="Delete a career and all its junction table relationships.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Career not found"},
    },
)
async def delete_career(
    career_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    await career_service.delete_career(db, career_id)
    return MessageResponse(message="Career deleted successfully")
