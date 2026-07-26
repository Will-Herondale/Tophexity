from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.knowledge_base import (
    KBCareerDetail,
    KBCareerListResponse,
    KBCollegeListResponse,
    KBDegreeListResponse,
    KBExamListResponse,
    KBScholarshipListResponse,
    KBSkillListResponse,
    KBStatsResponse,
)
from app.services import knowledge_base_service

router = APIRouter()


@router.get(
    "/stats",
    response_model=KBStatsResponse,
    summary="Knowledge base statistics",
    description="Get total counts of all entities and available categories/industries.",
)
async def get_kb_stats(db: AsyncSession = Depends(get_db_session)):
    return await knowledge_base_service.get_stats(db)


@router.get(
    "/careers",
    response_model=KBCareerListResponse,
    summary="Browse careers",
    description="Browse and search careers with advanced filters including category, industry, skills, degrees, salary ranges, and work environment.",
)
async def browse_careers(
    search: str | None = Query(None, description="Full-text search in title and description"),
    category: str | None = Query(None, description="Filter by category (e.g., Healthcare, Technology)"),
    industry: str | None = Query(None, description="Filter by industry (e.g., Information Technology, Healthcare)"),
    skill: str | None = Query(None, description="Filter by skill name"),
    degree_level: str | None = Query(None, description="Filter by degree level (bachelor, master, etc.)"),
    demand_level: str | None = Query(None, description="Filter by demand level (high, very_high, etc.)"),
    min_salary: float | None = Query(None, description="Minimum entry-level salary"),
    max_salary: float | None = Query(None, description="Maximum highest salary"),
    work_environment: str | None = Query(None, description="Filter by work environment (remote, hybrid, on-site)"),
    sort_by: str = Query("title", description="Sort field: title, average_salary, entry_level_salary, mid_level_salary, senior_level_salary, highest_salary, created_at, updated_at"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
):
    return await knowledge_base_service.search_careers(
        db, search, category, industry, skill, degree_level, demand_level,
        min_salary, max_salary, work_environment, sort_by, sort_order, page, page_size,
    )


@router.get(
    "/careers/{career_id}",
    response_model=KBCareerDetail,
    summary="Career detail",
    description="Get full career details including all related skills, degrees, colleges, exams, scholarships, salary tiers, and metadata.",
    responses={"404": {"description": "Career not found"}},
)
async def get_career_detail(
    career_id: UUID,
    db: AsyncSession = Depends(get_db_session),
):
    return await knowledge_base_service.get_career_detail(db, career_id)


@router.get(
    "/skills",
    response_model=KBSkillListResponse,
    summary="Search skills",
    description="Browse and search all skills in the knowledge base with optional category filter.",
)
async def search_skills(
    search: str | None = Query(None, description="Search by skill name"),
    category: str | None = Query(None, description="Filter by skill category"),
    sort_by: str = Query("name", description="Sort field: name or category"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
):
    return await knowledge_base_service.search_skills(db, search, category, sort_by, sort_order, page, page_size)


@router.get(
    "/degrees",
    response_model=KBDegreeListResponse,
    summary="Search degrees",
    description="Browse and search all degrees with optional level and field filters.",
)
async def search_degrees(
    search: str | None = Query(None, description="Search by degree name"),
    level: str | None = Query(None, description="Filter by degree level (bachelor, master, phd, etc.)"),
    field: str | None = Query(None, description="Filter by field of study"),
    sort_by: str = Query("name", description="Sort field: name, level, or field"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
):
    return await knowledge_base_service.search_degrees(db, search, level, field, sort_by, sort_order, page, page_size)


@router.get(
    "/colleges",
    response_model=KBCollegeListResponse,
    summary="Search colleges",
    description="Browse and search colleges with optional location filter.",
)
async def search_colleges(
    search: str | None = Query(None, description="Search by college name"),
    location: str | None = Query(None, description="Filter by location"),
    sort_by: str = Query("name", description="Sort field: name, location, or ranking"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
):
    return await knowledge_base_service.search_colleges(db, search, location, sort_by, sort_order, page, page_size)


@router.get(
    "/entrance-exams",
    response_model=KBExamListResponse,
    summary="Search entrance exams",
    description="Browse and search entrance exams.",
)
async def search_exams(
    search: str | None = Query(None, description="Search by exam name"),
    sort_by: str = Query("name", description="Sort field: name"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
):
    return await knowledge_base_service.search_exams(db, search, sort_by, sort_order, page, page_size)


@router.get(
    "/scholarships",
    response_model=KBScholarshipListResponse,
    summary="Search scholarships",
    description="Browse and search scholarships with optional amount range filter.",
)
async def search_scholarships(
    search: str | None = Query(None, description="Search by name or description"),
    min_amount: float | None = Query(None, description="Minimum scholarship amount"),
    max_amount: float | None = Query(None, description="Maximum scholarship amount"),
    sort_by: str = Query("name", description="Sort field: name or amount"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
):
    return await knowledge_base_service.search_scholarships(db, search, min_amount, max_amount, sort_by, sort_order, page, page_size)
