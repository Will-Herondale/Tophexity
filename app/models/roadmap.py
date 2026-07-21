import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import RoadmapStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Roadmap(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "roadmaps"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[RoadmapStatus] = mapped_column(
        default=RoadmapStatus.ACTIVE, nullable=False, index=True
    )
    estimated_duration_months: Mapped[int | None] = mapped_column(Integer, nullable=True)

    user: Mapped["User"] = relationship(back_populates="roadmaps")
    career: Mapped["Career"] = relationship(back_populates="roadmaps")
    steps: Mapped[list["RoadmapStep"]] = relationship(
        back_populates="roadmap", order_by="RoadmapStep.step_order"
    )


class RoadmapStep(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "roadmap_steps"

    roadmap_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roadmaps.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    resources: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    roadmap: Mapped["Roadmap"] = relationship(back_populates="steps")
