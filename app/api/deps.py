from collections.abc import AsyncGenerator

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.utils.exceptions import UnauthorizedException


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException(detail="Invalid authorization header format")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise UnauthorizedException(detail="Invalid or expired token")
    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException(detail="Invalid token payload")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedException(detail="User not found")
    if not user.is_active:
        raise UnauthorizedException(detail="User account is deactivated")
    return user


get_current_active_user = get_current_user
