from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.profile import (
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    ProfileVersionResponse,
)
from app.services import profile_service

router = APIRouter()


@router.get("/health", summary="Users service health check", tags=["Users"])
async def users_health():
    return {"status": "users router active"}


@router.post(
    "/profile",
    response_model=ProfileResponse,
    status_code=201,
    summary="Create user profile",
    description="Create a detailed profile for the authenticated user. Only one profile per user.",
    responses={
        401: {"description": "Not authenticated"},
        409: {"description": "Profile already exists"},
    },
)
async def create_profile(
    data: ProfileCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await profile_service.create_profile(db, current_user, data)


@router.get(
    "/profile",
    response_model=ProfileResponse,
    summary="Get user profile",
    description="Retrieve the authenticated user's detailed profile.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Profile not found"},
    },
)
async def get_profile(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await profile_service.get_profile(db, current_user)


@router.put(
    "/profile",
    response_model=ProfileResponse,
    summary="Update user profile",
    description="Update the authenticated user's profile. Creates a version snapshot automatically.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Profile not found"},
    },
)
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await profile_service.update_profile(db, current_user, data)


@router.get(
    "/profile/versions",
    response_model=list[ProfileVersionResponse],
    summary="Get profile version history",
    description="Retrieve all historical snapshots of the user's profile.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Profile not found"},
    },
)
async def get_profile_versions(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await profile_service.get_profile_versions(db, current_user)
