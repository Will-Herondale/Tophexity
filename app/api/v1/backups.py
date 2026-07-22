from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.backup import (
    BackupPlanCreate,
    BackupPlanListResponse,
    BackupPlanResponse,
)
from app.services import backup_service

router = APIRouter()


@router.get("/health", summary="Backups service health check", tags=["Backups"])
async def backups_health():
    return {"status": "backups router active"}


@router.post(
    "",
    response_model=BackupPlanResponse,
    status_code=201,
    summary="Create backup plan",
    description="Store a new career backup plan with alternative career scenarios. Each scenario must reference a valid career_id.",
    responses={
        401: {"description": "Not authenticated"},
        422: {"description": "Validation error"},
    },
)
async def create_backup_plan(
    data: BackupPlanCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await backup_service.create_backup_plan(db, current_user, data)


@router.get(
    "/history",
    response_model=BackupPlanListResponse,
    summary="List backup plan history",
    description="Retrieve all past backup plans for the authenticated user, sorted by most recent.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_backup_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await backup_service.list_backup_plans(db, current_user, page, page_size)


@router.get(
    "/{plan_id}",
    response_model=BackupPlanResponse,
    summary="Get backup plan details",
    description="Retrieve a specific backup plan with all its alternative career scenarios.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Backup plan not found"},
    },
)
async def get_backup_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await backup_service.get_backup_plan(db, current_user, plan_id)
