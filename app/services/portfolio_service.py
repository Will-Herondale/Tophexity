import math
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import PortfolioItem
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioItemCreate,
    PortfolioItemResponse,
    PortfolioItemUpdate,
    PortfolioListResponse,
)
from app.utils.exceptions import NotFoundException
from app.utils.exceptions import safe_flush


async def create_portfolio_item(
    db: AsyncSession, user: User, data: PortfolioItemCreate
) -> PortfolioItemResponse:
    item = PortfolioItem(user_id=user.id, **data.model_dump())
    db.add(item)
    await safe_flush(db)
    return PortfolioItemResponse.model_validate(item)


async def list_portfolio_items(
    db: AsyncSession, user: User, page: int = 1, page_size: int = 20, item_type: str | None = None
) -> PortfolioListResponse:
    query = select(PortfolioItem).where(
        PortfolioItem.user_id == user.id,
        PortfolioItem.deleted_at.is_(None),
    )
    count_query = select(func.count(PortfolioItem.id)).where(
        PortfolioItem.user_id == user.id,
        PortfolioItem.deleted_at.is_(None),
    )
    if item_type:
        query = query.where(PortfolioItem.item_type == item_type)
        count_query = count_query.where(PortfolioItem.item_type == item_type)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    query = query.order_by(PortfolioItem.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [PortfolioItemResponse.model_validate(i) for i in result.scalars().all()]
    return PortfolioListResponse(
        items=items, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def get_portfolio_item(
    db: AsyncSession, user: User, item_id: UUID
) -> PortfolioItemResponse:
    result = await db.execute(
        select(PortfolioItem).where(
            PortfolioItem.id == item_id,
            PortfolioItem.user_id == user.id,
            PortfolioItem.deleted_at.is_(None),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException(detail="Portfolio item not found")
    return PortfolioItemResponse.model_validate(item)


async def update_portfolio_item(
    db: AsyncSession, user: User, item_id: UUID, data: PortfolioItemUpdate
) -> PortfolioItemResponse:
    result = await db.execute(
        select(PortfolioItem).where(
            PortfolioItem.id == item_id,
            PortfolioItem.user_id == user.id,
            PortfolioItem.deleted_at.is_(None),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException(detail="Portfolio item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await safe_flush(db)
    return PortfolioItemResponse.model_validate(item)


async def delete_portfolio_item(
    db: AsyncSession, user: User, item_id: UUID
) -> None:
    result = await db.execute(
        select(PortfolioItem).where(
            PortfolioItem.id == item_id,
            PortfolioItem.user_id == user.id,
            PortfolioItem.deleted_at.is_(None),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException(detail="Portfolio item not found")
    item.deleted_at = datetime.now(timezone.utc)
    await safe_flush(db)
