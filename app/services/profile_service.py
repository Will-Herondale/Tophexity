from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile, ProfileVersion
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate, ProfileVersionResponse
from app.utils.exceptions import ConflictException, NotFoundException
from app.utils.exceptions import safe_flush


async def create_profile(
    db: AsyncSession, user: User, data: ProfileCreate
) -> ProfileResponse:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    if result.scalar_one_or_none():
        raise ConflictException(detail="Profile already exists")
    profile = Profile(user_id=user.id, **data.model_dump(exclude_unset=True))
    db.add(profile)
    await safe_flush(db)
    version = ProfileVersion(
        profile_id=profile.id,
        version_number=1,
        snapshot=data.model_dump(),
    )
    db.add(version)
    await safe_flush(db)
    return ProfileResponse.model_validate(profile)


async def get_profile(db: AsyncSession, user: User) -> ProfileResponse:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundException(detail="Profile not found")
    return ProfileResponse.model_validate(profile)


async def update_profile(
    db: AsyncSession, user: User, data: ProfileUpdate
) -> ProfileResponse:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundException(detail="Profile not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    await safe_flush(db)
    snapshot = {}
    for col in Profile.__table__.columns:
        if col.name not in ("id", "user_id", "created_at", "updated_at"):
            snapshot[col.name] = str(getattr(profile, col.name)) if getattr(profile, col.name) is not None else None
    max_ver = await db.execute(
        select(ProfileVersion.version_number)
        .where(ProfileVersion.profile_id == profile.id)
        .order_by(ProfileVersion.version_number.desc())
        .limit(1)
    )
    last_ver = max_ver.scalar() or 0
    version = ProfileVersion(
        profile_id=profile.id,
        version_number=last_ver + 1,
        snapshot=snapshot,
    )
    db.add(version)
    await safe_flush(db)
    return ProfileResponse.model_validate(profile)


async def delete_profile(db: AsyncSession, user: User) -> None:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundException(detail="Profile not found")
    versions_result = await db.execute(
        select(ProfileVersion).where(ProfileVersion.profile_id == profile.id)
    )
    for v in versions_result.scalars().all():
        await db.delete(v)
    await db.delete(profile)
    await safe_flush(db)


async def get_profile_versions(
    db: AsyncSession, user: User
) -> list[ProfileVersionResponse]:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundException(detail="Profile not found")
    result = await db.execute(
        select(ProfileVersion)
        .where(ProfileVersion.profile_id == profile.id)
        .order_by(ProfileVersion.version_number.desc())
    )
    return [ProfileVersionResponse.model_validate(v) for v in result.scalars().all()]
