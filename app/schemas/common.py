from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


class GenerationStatusResponse(BaseModel):
    has_profile: bool
    has_recommendations: bool
    has_roadmaps: bool
    has_backup_plans: bool
    has_portfolio_items: bool
    has_chat_sessions: bool
    recommendation_count: int
    roadmap_count: int
    backup_plan_count: int
    portfolio_item_count: int
    chat_session_count: int
