from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.backup import BackupPlan
from app.models.chat import ChatSession
from app.models.portfolio import PortfolioItem
from app.models.profile import Profile
from app.models.recommendation import Recommendation
from app.models.roadmap import Roadmap
from app.models.user import User
from app.schemas.common import GenerationStatusResponse
from app.schemas.profile import (
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    ProfileVersionResponse,
)
from app.schemas.common import MessageResponse
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


@router.delete(
    "/profile",
    response_model=MessageResponse,
    summary="Delete user profile",
    description="Delete the authenticated user's profile and all version snapshots.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Profile not found"},
    },
)
async def delete_profile(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    await profile_service.delete_profile(db, current_user)
    return MessageResponse(message="Profile deleted")


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


@router.get(
    "/generation-status",
    response_model=GenerationStatusResponse,
    summary="Get AI generation status",
    description="Indicates whether the user has generated AI content (recommendations, roadmaps, backup plans) and completed their profile.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_generation_status(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    async def count_table(model) -> int:
        result = await db.execute(
            select(func.count()).select_from(model).where(model.user_id == current_user.id)
        )
        return result.scalar() or 0

    recs = await count_table(Recommendation)
    roadmaps = await count_table(Roadmap)
    backups = await count_table(BackupPlan)
    portfolio = await count_table(PortfolioItem)
    chats = await count_table(ChatSession)

    profile_result = await db.execute(
        select(func.count()).select_from(Profile).where(Profile.user_id == current_user.id)
    )
    has_profile = (profile_result.scalar() or 0) > 0

    return GenerationStatusResponse(
        has_profile=has_profile,
        has_recommendations=recs > 0,
        has_roadmaps=roadmaps > 0,
        has_backup_plans=backups > 0,
        has_portfolio_items=portfolio > 0,
        has_chat_sessions=chats > 0,
        recommendation_count=recs,
        roadmap_count=roadmaps,
        backup_plan_count=backups,
        portfolio_item_count=portfolio,
        chat_session_count=chats,
    )
