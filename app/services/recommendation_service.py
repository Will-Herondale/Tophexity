import math
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.recommendation import Recommendation, RecommendationItem
from app.models.career import Career
from app.models.user import User
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationListResponse,
    RecommendationResponse,
)
from app.utils.exceptions import NotFoundException, safe_flush


async def create_recommendation(
    db: AsyncSession, user: User, data: RecommendationCreate
) -> RecommendationResponse:
    recommendation = Recommendation(
        user_id=user.id,
        title=data.title,
        summary=data.summary,
        status="completed",
    )
    db.add(recommendation)
    await safe_flush(db)
    for item_data in data.items:
        item = RecommendationItem(
            recommendation_id=recommendation.id,
            career_id=item_data.career_id,
            match_score=item_data.match_score,
            reasoning=item_data.reasoning,
            rank=item_data.rank,
        )
        db.add(item)
    await safe_flush(db)
    result = await db.execute(
        select(Recommendation)
        .options(selectinload(Recommendation.items).selectinload(RecommendationItem.career))
        .where(Recommendation.id == recommendation.id)
    )
    rec = result.unique().scalar_one()
    return RecommendationResponse.model_validate(rec)


async def get_recommendation(
    db: AsyncSession, user: User, recommendation_id: UUID
) -> RecommendationResponse:
    result = await db.execute(
        select(Recommendation)
        .options(selectinload(Recommendation.items).selectinload(RecommendationItem.career))
        .where(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == user.id,
        )
    )
    rec = result.unique().scalar_one_or_none()
    if not rec:
        raise NotFoundException(detail="Recommendation not found")
    return RecommendationResponse.model_validate(rec)


async def list_recommendations(
    db: AsyncSession, user: User, page: int = 1, page_size: int = 20
) -> RecommendationListResponse:
    count_query = select(func.count(Recommendation.id)).where(
        Recommendation.user_id == user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    query = (
        select(Recommendation)
        .options(selectinload(Recommendation.items).selectinload(RecommendationItem.career))
        .where(Recommendation.user_id == user.id)
        .order_by(Recommendation.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    recs = [RecommendationResponse.model_validate(r) for r in result.unique().scalars().all()]
    return RecommendationListResponse(
        items=recs, total=total, page=page, page_size=page_size, total_pages=total_pages
    )
