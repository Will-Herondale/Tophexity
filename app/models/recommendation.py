import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import RecommendationStatus
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Recommendation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "recommendations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[RecommendationStatus] = mapped_column(
        default=RecommendationStatus.PENDING, nullable=False, index=True
    )

    user: Mapped["User"] = relationship(back_populates="recommendations")
    items: Mapped[list["RecommendationItem"]] = relationship(
        back_populates="recommendation", order_by="RecommendationItem.rank"
    )


class RecommendationItem(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "recommendation_items"

    recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recommendations.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="RESTRICT"),
        nullable=False, index=True,
    )
    match_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    recommendation: Mapped["Recommendation"] = relationship(back_populates="items")
    career: Mapped["Career"] = relationship(back_populates="recommendation_items")
