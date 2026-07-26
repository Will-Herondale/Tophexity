"""Intelligence API - AI-powered career guidance endpoints.

All endpoints for recommendations, roadmaps, backup plans,
semantic search, RAG, and embedding management.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.backup import BackupPlanListResponse, BackupPlanResponse
from app.schemas.common import MessageResponse
from app.schemas.intelligence import (
    CareerComparisonRequest,
    CareerComparisonResponse,
    DebugRetrievalRequest,
    DebugRetrievalResponse,
    EmbeddingJobResponse,
    EmbeddingStatusResponse,
    GenerateBackupRequest,
    GenerateBackupResponse,
    GenerateRecommendationRequest,
    GenerateRecommendationResponse,
    GenerateRoadmapRequest,
    GenerateRoadmapResponse,
    RebuildEmbeddingsRequest,
    RebuildEmbeddingsResponse,
    RetrievalResponse,
    RetrievalResult,
    SemanticSearchRequest,
)
from app.schemas.recommendation import RecommendationListResponse, RecommendationResponse
from app.schemas.roadmap import RoadmapListResponse, RoadmapResponse
from app.services import recommendation_engine, roadmap_engine, backup_engine
from app.services import recommendation_service, roadmap_service, backup_service
from app.services import embedding_service, retrieval_engine

router = APIRouter()


@router.get(
    "/recommendations",
    response_model=RecommendationListResponse,
    summary="List user's recommendation history",
    description="Get all career recommendations generated for the current user.",
)
async def list_recommendations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    return await recommendation_service.list_recommendations(db, user, page, page_size)


@router.get(
    "/recommendations/{recommendation_id}",
    response_model=RecommendationResponse,
    summary="Get recommendation details",
    description="Retrieve a specific recommendation with all its items.",
)
async def get_recommendation(
    recommendation_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    return await recommendation_service.get_recommendation(db, user, recommendation_id)


@router.post(
    "/recommendations/generate",
    response_model=GenerateRecommendationResponse,
    summary="Generate career recommendations",
    description="AI-powered career recommendations based on user profile, portfolio, and knowledge base.",
    status_code=201,
)
async def generate_recommendation(
    request: GenerateRecommendationRequest,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    rec = await recommendation_engine.generate_recommendation(
        db, user,
        include_profile=request.include_profile,
        max_results=request.max_results,
    )
    return GenerateRecommendationResponse(
        recommendation_id=rec.id,
        title=rec.title,
        summary=rec.summary,
        items=[{"career_id": str(i.career_id), "match_score": float(i.match_score), "reasoning": i.reasoning, "rank": i.rank} for i in rec.items],
        generated_at=rec.created_at,
    )


@router.post(
    "/recommendations/{recommendation_id}/regenerate",
    response_model=GenerateRecommendationResponse,
    summary="Regenerate recommendations",
    description="Regenerate career recommendations based on updated profile or knowledge.",
    status_code=201,
)
async def regenerate_recommendation(
    recommendation_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    rec = await recommendation_engine.generate_recommendation(db, user)
    return GenerateRecommendationResponse(
        recommendation_id=rec.id,
        title=rec.title,
        summary=rec.summary,
        items=[{"career_id": str(i.career_id), "match_score": float(i.match_score), "reasoning": i.reasoning, "rank": i.rank} for i in rec.items],
        generated_at=rec.created_at,
    )


@router.post(
    "/compare",
    response_model=CareerComparisonResponse,
    summary="Compare two careers",
    description="AI-powered comparison of two career paths with detailed analysis.",
)
async def compare_careers(
    request: CareerComparisonRequest,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    result = await recommendation_engine.compare_careers(db, request.career_id_1, request.career_id_2)
    return CareerComparisonResponse(**result)


@router.get(
    "/roadmaps",
    response_model=RoadmapListResponse,
    summary="List user's roadmaps",
    description="Get all roadmaps generated for the current user.",
)
async def list_roadmaps(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    return await roadmap_service.list_roadmaps(db, user, page, page_size)


@router.get(
    "/roadmaps/{roadmap_id}",
    response_model=RoadmapResponse,
    summary="Get roadmap details",
    description="Retrieve a specific roadmap with all its steps.",
)
async def get_roadmap(
    roadmap_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    return await roadmap_service.get_roadmap(db, user, roadmap_id)


@router.post(
    "/roadmaps/generate",
    response_model=GenerateRoadmapResponse,
    summary="Generate career roadmap",
    description="AI-powered personalized roadmap with milestones, timelines, and resources.",
    status_code=201,
)
async def generate_roadmap(
    request: GenerateRoadmapRequest,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    rm = await roadmap_engine.generate_roadmap(
        db, user,
        career_id=request.career_id,
        roadmap_type=request.roadmap_type,
        custom_duration_months=request.custom_duration_months,
    )
    return GenerateRoadmapResponse(
        roadmap_id=rm.id,
        title=rm.title,
        description=rm.description,
        estimated_duration_months=rm.estimated_duration_months,
        steps=[{"title": s.title, "description": s.description, "step_order": s.step_order, "duration_months": s.duration_months, "resources": s.resources} for s in rm.steps],
        generated_at=rm.created_at,
    )


@router.post(
    "/roadmaps/{roadmap_id}/regenerate",
    response_model=GenerateRoadmapResponse,
    summary="Regenerate roadmap",
    description="Regenerate a roadmap with updated context.",
    status_code=201,
)
async def regenerate_roadmap(
    roadmap_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    existing = await roadmap_service.get_roadmap(db, user, roadmap_id)
    rm = await roadmap_engine.generate_roadmap(db, user, career_id=existing.career_id)
    return GenerateRoadmapResponse(
        roadmap_id=rm.id,
        title=rm.title,
        description=rm.description,
        estimated_duration_months=rm.estimated_duration_months,
        steps=[{"title": s.title, "description": s.description, "step_order": s.step_order, "duration_months": s.duration_months, "resources": s.resources} for s in rm.steps],
        generated_at=rm.created_at,
    )


@router.get(
    "/backups",
    response_model=BackupPlanListResponse,
    summary="List user's backup plans",
    description="Get all backup plans generated for the current user.",
)
async def list_backups(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    return await backup_service.list_backup_plans(db, user, page, page_size)


@router.get(
    "/backups/{backup_id}",
    response_model=BackupPlanResponse,
    summary="Get backup plan details",
    description="Retrieve a specific backup plan with all its scenarios.",
)
async def get_backup(
    backup_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    return await backup_service.get_backup_plan(db, user, backup_id)


@router.post(
    "/backups/generate",
    response_model=GenerateBackupResponse,
    summary="Generate backup plan",
    description="AI-powered backup plan with alternative careers, trade-offs, and transition difficulty.",
    status_code=201,
)
async def generate_backup(
    request: GenerateBackupRequest,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    plan = await backup_engine.generate_backup_plan(
        db, user,
        career_id=request.career_id,
        max_scenarios=request.max_scenarios,
    )
    return GenerateBackupResponse(
        backup_plan_id=plan.id,
        title=plan.title,
        scenarios=[{"scenario_name": s.scenario_name, "career_id": str(s.career_id), "description": s.description, "transition_difficulty": s.transition_difficulty, "reasoning": s.reasoning} for s in plan.scenarios],
        generated_at=plan.created_at,
    )


@router.post(
    "/search/semantic",
    response_model=RetrievalResponse,
    summary="Semantic search",
    description="Semantic search over the knowledge base using vector embeddings.",
)
async def semantic_search(
    request: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db_session),
):
    results = await retrieval_engine.semantic_search(
        db, request.query,
        source_types=request.source_types,
        top_k=request.top_k,
        score_threshold=request.score_threshold,
        metadata_filters=request.metadata_filters,
    )
    return RetrievalResponse(
        query=request.query,
        results=[RetrievalResult(**r) for r in results],
        total_results=len(results),
        search_type="semantic",
    )


@router.post(
    "/search/hybrid",
    response_model=RetrievalResponse,
    summary="Hybrid search",
    description="Combined semantic and keyword search over the knowledge base.",
)
async def hybrid_search(
    request: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db_session),
):
    results = await retrieval_engine.hybrid_search(
        db, request.query,
        source_types=request.source_types,
        top_k=request.top_k,
        score_threshold=request.score_threshold,
    )
    return RetrievalResponse(
        query=request.query,
        results=[RetrievalResult(**r) for r in results],
        total_results=len(results),
        search_type="hybrid",
    )


@router.post(
    "/search/debug",
    response_model=DebugRetrievalResponse,
    summary="Debug retrieval",
    description="Debug endpoint for analyzing retrieval results and performance.",
)
async def debug_retrieval(
    request: DebugRetrievalRequest,
    db: AsyncSession = Depends(get_db_session),
):
    result = await retrieval_engine.debug_retrieval(
        db, request.query,
        source_type=request.source_type,
        top_k=request.top_k,
    )
    return DebugRetrievalResponse(**result)


@router.get(
    "/embeddings/status",
    response_model=EmbeddingStatusResponse,
    summary="Embedding status",
    description="Get current status of all embeddings in the knowledge base.",
)
async def embedding_status(
    db: AsyncSession = Depends(get_db_session),
):
    status = await embedding_service.get_embedding_status(db)
    return EmbeddingStatusResponse(**status)


@router.post(
    "/embeddings/rebuild",
    response_model=RebuildEmbeddingsResponse,
    summary="Rebuild embeddings",
    description="Trigger a background job to rebuild embeddings for all or specific source types.",
)
async def rebuild_embeddings(
    request: RebuildEmbeddingsRequest,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    result = await embedding_service.rebuild_embeddings(source_type=request.source_type)
    return RebuildEmbeddingsResponse(**result)


@router.get(
    "/embeddings/jobs/{job_id}",
    response_model=EmbeddingJobResponse,
    summary="Get embedding job status",
    description="Check the status of a running embedding rebuild job.",
)
async def get_embedding_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db_session),
):
    from app.models.embedding import EmbeddingJob
    job = await db.get(EmbeddingJob, job_id)
    if not job:
        from app.utils.exceptions import NotFoundException
        raise NotFoundException(detail="Job not found")
    return EmbeddingJobResponse.model_validate(job)
