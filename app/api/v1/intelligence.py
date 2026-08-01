"""Intelligence API - AI-powered career guidance endpoints.

All endpoints for recommendations, roadmaps, backup plans,
semantic search, RAG, and embedding management.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session, require_admin
from app.models.user import User

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
    ProgressResponse,
    RebuildEmbeddingsRequest,
    RebuildEmbeddingsResponse,
    RetrievalResponse,
    RetrievalResult,
    SemanticSearchRequest,
)
from app.services import recommendation_engine, roadmap_engine, backup_engine
from app.services import roadmap_service
from app.services import embedding_service, retrieval_engine
from app.services.progress_store import progress_store
from app.utils.exceptions import NotFoundException

router = APIRouter()


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
        progress_token=request.progress_token,
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
    progress_token: str | None = Query(None, description="Optional token for polling generation progress"),
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    rec = await recommendation_engine.generate_recommendation(
        db, user, progress_token=progress_token,
    )
    return GenerateRecommendationResponse(
        recommendation_id=rec.id,
        title=rec.title,
        summary=rec.summary,
        items=[{"career_id": str(i.career_id), "match_score": float(i.match_score), "reasoning": i.reasoning, "rank": i.rank} for i in rec.items],
        generated_at=rec.created_at,
    )


@router.get(
    "/progress/{token}",
    response_model=ProgressResponse,
    summary="Get generation progress",
    description="Poll progress of an in-flight AI generation using its progress token.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Progress token not found or expired"},
    },
)
async def get_generation_progress(
    token: str,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(get_current_active_user),
):
    rec = progress_store.get(token)
    if not rec or rec["user_id"] != str(user.id):
        raise NotFoundException(detail="Progress not found or expired")
    return ProgressResponse(
        token=token,
        percent=rec["percent"],
        phase=rec["phase"],
        message=rec["message"],
        status=rec["status"],
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
        progress_token=request.progress_token,
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
        progress_token=request.progress_token,
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
    user: User = Depends(get_current_active_user),
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
    user: User = Depends(get_current_active_user),
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
    user: User = Depends(get_current_active_user),
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
    user: User = Depends(get_current_active_user),
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
    admin: User = Depends(require_admin),
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
    user: User = Depends(get_current_active_user),
):
    from app.models.embedding import EmbeddingJob
    job = await db.get(EmbeddingJob, job_id)
    if not job:
        raise NotFoundException(detail="Job not found")
    return EmbeddingJobResponse.model_validate(job)
