from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PromptMetadata(BaseModel):
    name: str
    version: str = "1"
    description: str = ""
    char_count: int = 0
    estimated_tokens: int = 0
    variables: list[str] = []
    last_loaded_at: str | None = None


class PromptListResponse(BaseModel):
    prompts: list[PromptMetadata]


class PromptTestRequest(BaseModel):
    variables: dict[str, str] = {}


class PromptTestResponse(BaseModel):
    name: str
    rendered: str
    char_count: int
    estimated_tokens: int
