from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RoadmapStepCreate(BaseModel):
    title: str = Field(..., max_length=500)
    description: str | None = None
    step_order: int = Field(..., ge=1)
    duration_months: int | None = None
    resources: list[dict] | None = None


class RoadmapCreate(BaseModel):
    career_id: UUID
    title: str | None = None
    description: str | None = None
    estimated_duration_months: int | None = None
    steps: list[RoadmapStepCreate]


class RoadmapStepResponse(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    step_order: int
    duration_months: int | None = None
    resources: list[dict] | None = None

    model_config = {"from_attributes": True}


class RoadmapResponse(BaseModel):
    id: UUID
    user_id: UUID
    career_id: UUID
    title: str | None = None
    description: str | None = None
    status: str
    estimated_duration_months: int | None = None
    steps: list[RoadmapStepResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class RoadmapListResponse(BaseModel):
    items: list[RoadmapResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
