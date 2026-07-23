import math
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.backup import BackupPlan, BackupScenario
from app.models.user import User
from app.schemas.backup import (
    BackupPlanCreate,
    BackupPlanListResponse,
    BackupPlanResponse,
)
from app.utils.exceptions import NotFoundException, safe_flush


async def create_backup_plan(
    db: AsyncSession, user: User, data: BackupPlanCreate
) -> BackupPlanResponse:
    plan = BackupPlan(
        user_id=user.id,
        title=data.title,
        description=data.description,
        status="active",
    )
    db.add(plan)
    await safe_flush(db)
    for scenario_data in data.scenarios:
        scenario = BackupScenario(
            backup_plan_id=plan.id,
            career_id=scenario_data.career_id,
            scenario_name=scenario_data.scenario_name,
            description=scenario_data.description,
            transition_difficulty=scenario_data.transition_difficulty,
            estimated_transition_months=scenario_data.estimated_transition_months,
            reasoning=scenario_data.reasoning,
        )
        db.add(scenario)
    await safe_flush(db)
    result = await db.execute(
        select(BackupPlan)
        .options(selectinload(BackupPlan.scenarios))
        .where(BackupPlan.id == plan.id)
    )
    bp = result.unique().scalar_one()
    return BackupPlanResponse.model_validate(bp)


async def get_backup_plan(
    db: AsyncSession, user: User, plan_id: UUID
) -> BackupPlanResponse:
    result = await db.execute(
        select(BackupPlan)
        .options(selectinload(BackupPlan.scenarios))
        .where(BackupPlan.id == plan_id, BackupPlan.user_id == user.id)
    )
    bp = result.unique().scalar_one_or_none()
    if not bp:
        raise NotFoundException(detail="Backup plan not found")
    return BackupPlanResponse.model_validate(bp)


async def list_backup_plans(
    db: AsyncSession, user: User, page: int = 1, page_size: int = 20
) -> BackupPlanListResponse:
    count_query = select(func.count(BackupPlan.id)).where(BackupPlan.user_id == user.id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    query = (
        select(BackupPlan)
        .options(selectinload(BackupPlan.scenarios))
        .where(BackupPlan.user_id == user.id)
        .order_by(BackupPlan.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    plans = [BackupPlanResponse.model_validate(b) for b in result.unique().scalars().all()]
    return BackupPlanListResponse(
        items=plans, total=total, page=page, page_size=page_size, total_pages=total_pages
    )
