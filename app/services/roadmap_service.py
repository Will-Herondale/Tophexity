import math
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.roadmap import Roadmap, RoadmapStep
from app.models.user import User
from app.schemas.roadmap import (
    RoadmapCreate,
    RoadmapListResponse,
    RoadmapResponse,
)
from app.utils.exceptions import NotFoundException, safe_flush


async def create_roadmap(
    db: AsyncSession, user: User, data: RoadmapCreate
) -> RoadmapResponse:
    roadmap = Roadmap(
        user_id=user.id,
        career_id=data.career_id,
        title=data.title,
        description=data.description,
        estimated_duration_months=data.estimated_duration_months,
        status="active",
    )
    db.add(roadmap)
    await safe_flush(db)
    for step_data in data.steps:
        step = RoadmapStep(
            roadmap_id=roadmap.id,
            title=step_data.title,
            description=step_data.description,
            step_order=step_data.step_order,
            duration_months=step_data.duration_months,
            resources=step_data.resources,
        )
        db.add(step)
    await safe_flush(db)
    result = await db.execute(
        select(Roadmap)
        .options(selectinload(Roadmap.steps))
        .where(Roadmap.id == roadmap.id)
    )
    rm = result.unique().scalar_one()
    return RoadmapResponse.model_validate(rm)


async def get_roadmap(
    db: AsyncSession, user: User, roadmap_id: UUID
) -> RoadmapResponse:
    result = await db.execute(
        select(Roadmap)
        .options(selectinload(Roadmap.steps))
        .where(Roadmap.id == roadmap_id, Roadmap.user_id == user.id)
    )
    rm = result.unique().scalar_one_or_none()
    if not rm:
        raise NotFoundException(detail="Roadmap not found")
    return RoadmapResponse.model_validate(rm)


async def list_roadmaps(
    db: AsyncSession, user: User, page: int = 1, page_size: int = 20
) -> RoadmapListResponse:
    count_query = select(func.count(Roadmap.id)).where(Roadmap.user_id == user.id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    query = (
        select(Roadmap)
        .options(selectinload(Roadmap.steps))
        .where(Roadmap.user_id == user.id)
        .order_by(Roadmap.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    roadmaps = [RoadmapResponse.model_validate(r) for r in result.unique().scalars().all()]
    return RoadmapListResponse(
        items=roadmaps, total=total, page=page, page_size=page_size, total_pages=total_pages
    )
