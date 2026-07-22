from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RecommendationItemCreate(BaseModel):
    career_id: UUID
    match_score: float = Field(..., ge=0.0, le=100.0)
    reasoning: str | None = None
    rank: int = Field(..., ge=1)


class RecommendationCreate(BaseModel):
    title: str | None = None
    summary: str | None = None
    items: list[RecommendationItemCreate]


class RecommendationItemResponse(BaseModel):
    id: UUID
    career_id: UUID
    match_score: float
    reasoning: str | None = None
    rank: int

    model_config = {"from_attributes": True}


class RecommendationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None = None
    summary: str | None = None
    status: str
    items: list[RecommendationItemResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class RecommendationListResponse(BaseModel):
    items: list[RecommendationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
