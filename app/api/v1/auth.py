from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.common import MessageResponse
from app.services import auth_service

router = APIRouter()


@router.get("/health", summary="Auth service health check", tags=["Auth"])
async def auth_health():
    return {"status": "auth router active"}


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    summary="Register a new user",
    description="Create a new user account with email and password. Password must be 8-128 characters. Profile can be created separately after registration.",
    response_description="Created user profile",
    responses={
        409: {"description": "Email already registered"},
        422: {"description": "Validation error"},
    },
)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db_session)):
    return await auth_service.register_user(db, data)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user",
    description="Login with email and password to receive JWT access and refresh tokens.",
    response_description="Access and refresh tokens",
    responses={
        401: {"description": "Invalid credentials"},
    },
)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    return await auth_service.authenticate_user(db, data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Exchange a valid refresh token for new access and refresh tokens.",
    responses={
        401: {"description": "Invalid or expired refresh token"},
    },
)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db_session)):
    return await auth_service.refresh_tokens(db, data.refresh_token)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user",
    description="Logout the current user. Client should discard stored tokens.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def logout(current_user: User = Depends(get_current_active_user)):
    return MessageResponse(message="Successfully logged out")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Retrieve the authenticated user's account information.",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    return UserResponse.model_validate(current_user)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request password reset",
    description="Submit an email address to receive a password reset token. Returns a success message regardless of whether the email exists.",
    responses={
        422: {"description": "Validation error"},
    },
)
async def forgot_password(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db_session)
):
    await auth_service.forgot_password(db, data.email)
    return MessageResponse(message="If the email exists, a reset link has been sent")


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password with token",
    description="Set a new password using the reset token received via email. Token expires after 15 minutes.",
    responses={
        400: {"description": "Invalid or expired token"},
        422: {"description": "Validation error"},
    },
)
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db_session)
):
    await auth_service.reset_password(db, data.token, data.new_password)
    return MessageResponse(message="Password has been reset successfully")
