import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import BackupPlanStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class BackupPlan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "backup_plans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[BackupPlanStatus] = mapped_column(
        default=BackupPlanStatus.ACTIVE, nullable=False, index=True
    )

    user: Mapped["User"] = relationship(back_populates="backup_plans")
    scenarios: Mapped[list["BackupScenario"]] = relationship(
        back_populates="backup_plan", order_by="BackupScenario.created_at"
    )


class BackupScenario(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "backup_scenarios"

    backup_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("backup_plans.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    scenario_name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    transition_difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True)
    estimated_transition_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)

    backup_plan: Mapped["BackupPlan"] = relationship(back_populates="scenarios")
    career: Mapped["Career"] = relationship(back_populates="backup_scenarios")
