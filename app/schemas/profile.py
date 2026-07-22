from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProfileCreate(BaseModel):
    full_name: str | None = None
    headline: str | None = None
    bio: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    education_level: str | None = None
    years_experience: int | None = None
    current_field: str | None = None
    target_fields: dict | None = None
    skills: dict | None = None
    interests: dict | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    headline: str | None = None
    bio: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    education_level: str | None = None
    years_experience: int | None = None
    current_field: str | None = None
    target_fields: dict | None = None
    skills: dict | None = None
    interests: dict | None = None


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str | None = None
    headline: str | None = None
    bio: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    education_level: str | None = None
    years_experience: int | None = None
    current_field: str | None = None
    target_fields: dict | None = None
    skills: dict | None = None
    interests: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileVersionResponse(BaseModel):
    id: UUID
    version_number: int
    snapshot: dict

    model_config = {"from_attributes": True}
