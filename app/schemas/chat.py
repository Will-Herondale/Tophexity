from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChatSessionCreate(BaseModel):
    title: str | None = None


class ChatMessageCreate(BaseModel):
    role: str = Field(..., pattern=r"^(user|assistant|system)$")
    content: str = Field(..., min_length=1)


class ChatSessionUpdate(BaseModel):
    title: str | None = Field(None, max_length=500)
    is_pinned: bool | None = None
    is_archived: bool | None = None


class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None = None
    is_archived: bool = False
    is_pinned: bool = False
    session_data: dict = {}
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    token_count: int | None = None
    model_used: str | None = None
    latency_ms: float | None = None
    request_id: str | None = None
    message_data: dict = {}
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None = None
    is_archived: bool = False
    is_pinned: bool = False
    summary: str | None = None
    session_data: dict = {}
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse] = []

    model_config = {"from_attributes": True}


class ChatSessionListResponse(BaseModel):
    items: list[ChatSessionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ChatStatsResponse(BaseModel):
    total_sessions: int
    active_sessions: int
    archived_sessions: int
    total_messages: int
    total_tokens_used: int
    estimated_total_cost_usd: float
    average_messages_per_session: float
    first_conversation_at: datetime | None = None
    last_conversation_at: datetime | None = None


class ChatExportFormat(str):
    JSON = "json"
    MARKDOWN = "markdown"
    TEXT = "text"


class ChatExportResponse(BaseModel):
    session: dict
    summary: str | None = None
    messages: list[dict]


class ChatRegenerateResponse(BaseModel):
    original_message_id: UUID
    new_message: ChatMessageResponse


class MemoryRebuildResponse(BaseModel):
    session_id: UUID
    summary: str | None = None
    summary_message_count: int
    facts_count: int
    message: str
