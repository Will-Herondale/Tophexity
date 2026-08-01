from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EmbeddingStatusResponse(BaseModel):
    total_embeddings: int
    embeddings_by_source: dict[str, int]
    latest_version: int
    last_updated: datetime | None = None
    embedding_model: str = "text-embedding-3-small"
    dimensions: int = 1536


class RebuildEmbeddingsRequest(BaseModel):
    source_type: str | None = Field(None, description="Specific source type to rebuild, or None for all")


class RebuildEmbeddingsResponse(BaseModel):
    job_id: UUID
    status: str
    message: str


class EmbeddingJobResponse(BaseModel):
    id: UUID
    status: str
    source_type: str | None = None
    total_items: int
    processed_items: int
    failed_items: int
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RetrievalResult(BaseModel):
    source_id: UUID
    source_type: str
    chunk_text: str
    score: float
    metadata: dict | None = None


class RetrievalResponse(BaseModel):
    query: str
    results: list[RetrievalResult]
    total_results: int
    search_type: str


class CareerComparisonRequest(BaseModel):
    career_id_1: UUID
    career_id_2: UUID


class CareerComparisonResponse(BaseModel):
    career_1: dict
    career_2: dict
    comparison: dict
    recommendation: str


class GenerateRecommendationRequest(BaseModel):
    include_profile: bool = Field(True, description="Use user profile for personalization")
    max_results: int = Field(10, ge=1, le=25, description="Maximum recommendations")
    progress_token: str | None = Field(
        None,
        description="Optional token for polling generation progress via GET /intelligence/progress/{token}",
        max_length=128,
    )


class ProgressResponse(BaseModel):
    token: str
    percent: int = Field(ge=0, le=100)
    phase: str
    message: str
    status: str


class GenerateRecommendationResponse(BaseModel):
    recommendation_id: UUID
    title: str | None = None
    summary: str | None = None
    items: list[dict]
    generated_at: datetime


class GenerateRoadmapRequest(BaseModel):
    career_id: UUID
    roadmap_type: str = Field("career", description="career, skill, certification, or research")
    custom_duration_months: int | None = Field(None, ge=1, le=120)
    progress_token: str | None = Field(
        None,
        description="Optional token for polling generation progress via GET /intelligence/progress/{token}",
        max_length=128,
    )


class GenerateRoadmapResponse(BaseModel):
    roadmap_id: UUID
    title: str | None = None
    description: str | None = None
    estimated_duration_months: int | None = None
    steps: list[dict]
    generated_at: datetime


class GenerateBackupRequest(BaseModel):
    career_id: UUID
    max_scenarios: int = Field(5, ge=1, le=10)
    progress_token: str | None = Field(
        None,
        description="Optional token for polling generation progress via GET /intelligence/progress/{token}",
        max_length=128,
    )


class GenerateBackupResponse(BaseModel):
    backup_plan_id: UUID
    title: str | None = None
    scenarios: list[dict]
    generated_at: datetime


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    source_types: list[str] | None = Field(None, description="Filter: career, skill, degree, college, scholarship, resource")
    top_k: int = Field(10, ge=1, le=50)
    score_threshold: float = Field(0.0, ge=0.0, le=1.0)
    metadata_filters: dict | None = None


class DebugRetrievalRequest(BaseModel):
    query: str
    source_type: str | None = None
    top_k: int = 20


class DebugRetrievalResponse(BaseModel):
    query: str
    embedding_time_ms: float
    search_time_ms: float
    total_results: int
    results: list[dict]
    filters_applied: dict
