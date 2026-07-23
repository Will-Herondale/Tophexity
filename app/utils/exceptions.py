from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden") -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad request") -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ConflictException(AppException):
    def __init__(self, detail: str = "Conflict") -> None:
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


async def safe_flush(session) -> None:
    """Flush the session, converting IntegrityError to a user-friendly ConflictException."""
    try:
        await session.flush()
    except IntegrityError as e:
        await session.rollback()
        orig = str(e.orig).lower() if e.orig else ""
        if "unique" in orig or "duplicate" in orig:
            raise ConflictException(detail="A record with this data already exists")
        if "foreign key" in orig:
            raise BadRequestException(detail="Referenced record does not exist")
        if "not null" in orig:
            raise BadRequestException(detail="Required field is missing")
        raise ConflictException(detail="Data integrity error")
