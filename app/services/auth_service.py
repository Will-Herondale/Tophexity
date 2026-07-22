from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.utils.exceptions import BadRequestException, ConflictException, UnauthorizedException


async def register_user(
    db: AsyncSession, data: RegisterRequest
) -> UserResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictException(detail="Email already registered")
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()
    return UserResponse.model_validate(user)


async def authenticate_user(
    db: AsyncSession, data: LoginRequest
) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise UnauthorizedException(detail="Invalid email or password")
    if not user.is_active:
        raise UnauthorizedException(detail="User account is deactivated")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user_id=user.id,
        email=user.email,
    )


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException(detail="Invalid or expired refresh token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedException(detail="User not found or deactivated")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user_id=user.id,
        email=user.email,
    )


async def get_user_response(db: AsyncSession, user: User) -> UserResponse:
    return UserResponse.model_validate(user)
