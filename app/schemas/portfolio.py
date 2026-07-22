from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import PortfolioItemType


class PortfolioItemCreate(BaseModel):
    title: str = Field(..., max_length=500)
    description: str | None = None
    url: str | None = None
    item_type: PortfolioItemType
    skills_used: dict | None = None


class PortfolioItemUpdate(BaseModel):
    title: str | None = Field(None, max_length=500)
    description: str | None = None
    url: str | None = None
    skills_used: dict | None = None


class PortfolioItemResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: str | None = None
    url: str | None = None
    item_type: str
    skills_used: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PortfolioListResponse(BaseModel):
    items: list[PortfolioItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
