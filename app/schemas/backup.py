from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class BackupScenarioCreate(BaseModel):
    career_id: UUID
    scenario_name: str = Field(..., max_length=500)
    description: str | None = None
    transition_difficulty: str | None = None
    estimated_transition_months: int | None = None
    reasoning: str | None = None


class BackupPlanCreate(BaseModel):
    title: str | None = None
    description: str | None = None
    scenarios: list[BackupScenarioCreate]


class BackupScenarioResponse(BaseModel):
    id: UUID
    career_id: UUID
    scenario_name: str
    description: str | None = None
    transition_difficulty: str | None = None
    estimated_transition_months: int | None = None
    reasoning: str | None = None

    model_config = {"from_attributes": True}


class BackupPlanResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None = None
    description: str | None = None
    status: str
    scenarios: list[BackupScenarioResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class BackupPlanListResponse(BaseModel):
    items: list[BackupPlanResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
