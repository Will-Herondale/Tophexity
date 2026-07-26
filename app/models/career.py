import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import CareerRelationType, SkillLevel
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Career(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "careers"

    title: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    average_salary: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    growth_outlook: Mapped[str | None] = mapped_column(String(100), nullable=True)
    demand_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    required_education: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    typical_skills: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Knowledge Base extended fields
    category: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    industry: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    work_environment: Mapped[str | None] = mapped_column(Text, nullable=True)
    weekly_hours: Mapped[str | None] = mapped_column(String(50), nullable=True)
    travel_requirement: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stress_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    work_life_balance: Mapped[str | None] = mapped_column(String(50), nullable=True)
    automation_risk: Mapped[str | None] = mapped_column(String(100), nullable=True)
    salary_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    entry_level_salary: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    mid_level_salary: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    senior_level_salary: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    highest_salary: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

    career_skills: Mapped[list["CareerSkill"]] = relationship(back_populates="career")
    career_degrees: Mapped[list["CareerDegree"]] = relationship(back_populates="career")
    career_colleges: Mapped[list["CareerCollege"]] = relationship(back_populates="career")
    career_exams: Mapped[list["CareerEntranceExam"]] = relationship(back_populates="career")
    career_scholarships: Mapped[list["CareerScholarship"]] = relationship(back_populates="career")
    career_resources: Mapped[list["CareerResource"]] = relationship(back_populates="career")
    outgoing_relations: Mapped[list["CareerRelation"]] = relationship(
        back_populates="career", foreign_keys="CareerRelation.career_id"
    )
    incoming_relations: Mapped[list["CareerRelation"]] = relationship(
        back_populates="related_career", foreign_keys="CareerRelation.related_career_id"
    )
    recommendation_items: Mapped[list["RecommendationItem"]] = relationship(back_populates="career")
    roadmaps: Mapped[list["Roadmap"]] = relationship(back_populates="career")
    backup_scenarios: Mapped[list["BackupScenario"]] = relationship(back_populates="career")


class Skill(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "skills"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    career_skills: Mapped[list["CareerSkill"]] = relationship(back_populates="skill")


class CareerSkill(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "career_skills"
    __table_args__ = (
        UniqueConstraint("career_id", "skill_id", name="uq_career_skill"),
    )

    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    level: Mapped[SkillLevel] = mapped_column(default=SkillLevel.INTERMEDIATE, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    career: Mapped["Career"] = relationship(back_populates="career_skills")
    skill: Mapped["Skill"] = relationship(back_populates="career_skills")


class Degree(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "degrees"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(100), nullable=False)
    field: Mapped[str | None] = mapped_column(String(255), nullable=True)

    career_degrees: Mapped[list["CareerDegree"]] = relationship(back_populates="degree")


class CareerDegree(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "career_degrees"
    __table_args__ = (
        UniqueConstraint("career_id", "degree_id", name="uq_career_degree"),
    )

    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    degree_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("degrees.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    career: Mapped["Career"] = relationship(back_populates="career_degrees")
    degree: Mapped["Degree"] = relationship(back_populates="career_degrees")


class College(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "colleges"

    name: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    ranking: Mapped[int | None] = mapped_column(Integer, nullable=True)

    career_colleges: Mapped[list["CareerCollege"]] = relationship(back_populates="college")


class CareerCollege(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "career_colleges"
    __table_args__ = (
        UniqueConstraint("career_id", "college_id", name="uq_career_college"),
    )

    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("colleges.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    program_name: Mapped[str | None] = mapped_column(String(500), nullable=True)

    career: Mapped["Career"] = relationship(back_populates="career_colleges")
    college: Mapped["College"] = relationship(back_populates="career_colleges")


class EntranceExam(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "entrance_exams"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    career_exams: Mapped[list["CareerEntranceExam"]] = relationship(back_populates="exam")


class CareerEntranceExam(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "career_entrance_exams"
    __table_args__ = (
        UniqueConstraint("career_id", "exam_id", name="uq_career_exam"),
    )

    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entrance_exams.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    career: Mapped["Career"] = relationship(back_populates="career_exams")
    exam: Mapped["EntranceExam"] = relationship(back_populates="career_exams")


class Scholarship(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "scholarships"

    name: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    eligibility: Mapped[str | None] = mapped_column(Text, nullable=True)
    deadline: Mapped[str | None] = mapped_column(String(50), nullable=True)
    website: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    career_scholarships: Mapped[list["CareerScholarship"]] = relationship(back_populates="scholarship")


class CareerScholarship(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "career_scholarships"
    __table_args__ = (
        UniqueConstraint("career_id", "scholarship_id", name="uq_career_scholarship"),
    )

    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scholarship_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scholarships.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    career: Mapped["Career"] = relationship(back_populates="career_scholarships")
    scholarship: Mapped["Scholarship"] = relationship(back_populates="career_scholarships")


class Resource(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "resources"

    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    career_resources: Mapped[list["CareerResource"]] = relationship(back_populates="resource")


class CareerResource(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "career_resources"
    __table_args__ = (
        UniqueConstraint("career_id", "resource_id", name="uq_career_resource"),
    )

    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    career: Mapped["Career"] = relationship(back_populates="career_resources")
    resource: Mapped["Resource"] = relationship(back_populates="career_resources")


class CareerRelation(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "career_relations"
    __table_args__ = (
        UniqueConstraint(
            "career_id", "related_career_id", "relation_type",
            name="uq_career_relation",
        ),
    )

    career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    related_career_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    relation_type: Mapped[CareerRelationType] = mapped_column(nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    career: Mapped["Career"] = relationship(
        back_populates="outgoing_relations", foreign_keys=[career_id]
    )
    related_career: Mapped["Career"] = relationship(
        back_populates="incoming_relations", foreign_keys=[related_career_id]
    )
