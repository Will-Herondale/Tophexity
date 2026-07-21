"""update_fk_delete_behaviors

Revision ID: 7dd0e554f9fc
Revises: 21039be197ed
Create Date: 2026-07-21 23:25:00.665572

Audit Summary:
  28 total FKs. 19 stay CASCADE. 9 change CASCADE -> RESTRICT.

  Reference data FKs (skill_id, degree_id, college_id, exam_id, scholarship_id,
  resource_id) change to RESTRICT to prevent accidental deletion of reference
  data that junction tables depend on.

  Historical data FKs (recommendation_items.career_id, roadmaps.career_id,
  backup_scenarios.career_id) change to RESTRICT to protect historical
  user data from being destroyed when a career is removed from the knowledge base.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7dd0e554f9fc'
down_revision: Union[str, None] = '21039be197ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (table, column, ref_table, ref_column, old_constraint_name, new_ondelete)
FK_CHANGES = [
    # Reference data -> junction tables: CASCADE -> RESTRICT
    ("career_skills", "skill_id", "skills", "id",
     "career_skills_skill_id_fkey", "RESTRICT"),
    ("career_degrees", "degree_id", "degrees", "id",
     "career_degrees_degree_id_fkey", "RESTRICT"),
    ("career_colleges", "college_id", "colleges", "id",
     "career_colleges_college_id_fkey", "RESTRICT"),
    ("career_entrance_exams", "exam_id", "entrance_exams", "id",
     "career_entrance_exams_exam_id_fkey", "RESTRICT"),
    ("career_scholarships", "scholarship_id", "scholarships", "id",
     "career_scholarships_scholarship_id_fkey", "RESTRICT"),
    ("career_resources", "resource_id", "resources", "id",
     "career_resources_resource_id_fkey", "RESTRICT"),
    # Historical data -> careers: CASCADE -> RESTRICT
    ("recommendation_items", "career_id", "careers", "id",
     "recommendation_items_career_id_fkey", "RESTRICT"),
    ("roadmaps", "career_id", "careers", "id",
     "roadmaps_career_id_fkey", "RESTRICT"),
    ("backup_scenarios", "career_id", "careers", "id",
     "backup_scenarios_career_id_fkey", "RESTRICT"),
]


def _drop_fk(table: str, constraint_name: str) -> None:
    op.drop_constraint(constraint_name, table, type_="foreignkey")


def _add_fk(
    table: str, column: str, ref_table: str, ref_column: str, ondelete: str
) -> None:
    op.create_foreign_key(
        f"{table}_{column}_fkey",
        table,
        ref_table,
        [column],
        [ref_column],
        ondelete=ondelete,
    )


def upgrade() -> None:
    for table, column, ref_table, ref_column, old_name, new_ondelete in FK_CHANGES:
        _drop_fk(table, old_name)
        _add_fk(table, column, ref_table, ref_column, new_ondelete)


def downgrade() -> None:
    for table, column, ref_table, ref_column, old_name, new_ondelete in reversed(
        FK_CHANGES
    ):
        _drop_fk(table, f"{table}_{column}_fkey")
        _add_fk(table, column, ref_table, ref_column, "CASCADE")
