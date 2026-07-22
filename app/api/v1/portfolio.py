from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioItemCreate,
    PortfolioItemResponse,
    PortfolioItemUpdate,
    PortfolioListResponse,
)
from app.schemas.common import MessageResponse
from app.services import portfolio_service

router = APIRouter()


@router.get("/health", summary="Portfolio service health check", tags=["Portfolio"])
async def portfolio_health():
    return {"status": "portfolio router active"}


@router.get(
    "/items",
    response_model=PortfolioListResponse,
    summary="List portfolio items",
    description="Retrieve a paginated list of portfolio items. Supports filtering by item_type.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def list_items(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    item_type: str | None = Query(None, description="Filter by type: project, hackathon, competition, certificate, research, internship, olympiad, leadership, volunteering, achievement"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await portfolio_service.list_portfolio_items(
        db, current_user, page, page_size, item_type
    )


@router.post(
    "/items",
    response_model=PortfolioItemResponse,
    status_code=201,
    summary="Create portfolio item",
    description="Add a new item to the user's portfolio. Valid types: project, hackathon, competition, certificate, research, internship, olympiad, leadership, volunteering, achievement.",
    responses={
        401: {"description": "Not authenticated"},
        422: {"description": "Invalid item_type"},
    },
)
async def create_item(
    data: PortfolioItemCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await portfolio_service.create_portfolio_item(db, current_user, data)


@router.get(
    "/items/{item_id}",
    response_model=PortfolioItemResponse,
    summary="Get portfolio item",
    description="Retrieve a specific portfolio item by ID.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Item not found"},
    },
)
async def get_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await portfolio_service.get_portfolio_item(db, current_user, item_id)


@router.put(
    "/items/{item_id}",
    response_model=PortfolioItemResponse,
    summary="Update portfolio item",
    description="Update fields of an existing portfolio item.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Item not found"},
    },
)
async def update_item(
    item_id: UUID,
    data: PortfolioItemUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    return await portfolio_service.update_portfolio_item(db, current_user, item_id, data)


@router.delete(
    "/items/{item_id}",
    response_model=MessageResponse,
    summary="Delete portfolio item",
    description="Soft-delete a portfolio item. The item is marked as deleted but not removed from the database.",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Item not found"},
    },
)
async def delete_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
):
    await portfolio_service.delete_portfolio_item(db, current_user, item_id)
    return MessageResponse(message="Portfolio item deleted")
