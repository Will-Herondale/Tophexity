"""Live tracker for embedding rebuild progress, speed, and ETA.

Usage examples:
  python scripts/track_embeddings_progress.py
  python scripts/track_embeddings_progress.py --source career --interval 10
  python scripts/track_embeddings_progress.py --source all --show-breakdown
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import time
from collections import deque
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.chdir(PROJECT_ROOT)
sys.path.insert(0, str(PROJECT_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

from app.core.database import async_session_factory
from app.models.career import (
    Career,
    CareerCollege,
    CareerDegree,
    CareerEntranceExam,
    CareerScholarship,
    CareerSkill,
    College,
    Degree,
    EntranceExam,
    Scholarship,
    Skill,
)
from app.models.embedding import DocumentEmbedding
from app.services.chunking import chunk_career

SOURCE_TYPES = ("career", "skill", "degree", "college", "scholarship", "exam")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Track embedding progress with speed and ETA")
    parser.add_argument(
        "--source",
        default="all",
        choices=("all", *SOURCE_TYPES),
        help="Track one source type or all combined",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=20.0,
        help="Polling interval in seconds (default: 20)",
    )
    parser.add_argument(
        "--window",
        type=int,
        default=6,
        help="Number of recent samples for speed smoothing (default: 6)",
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=0,
        help="Stop after N iterations (0 means run continuously)",
    )
    parser.add_argument(
        "--show-breakdown",
        action="store_true",
        help="When source=all, print per-source progress each poll",
    )
    args = parser.parse_args()
    if args.source == "all":
        args.show_breakdown = True
    return args


def _format_eta(seconds: float | None) -> str:
    if seconds is None:
        return "--"
    if seconds <= 0:
        return "0s"

    total_seconds = int(round(seconds))
    hours, rem = divmod(total_seconds, 3600)
    minutes, secs = divmod(rem, 60)

    if hours > 0:
        return f"{hours}h {minutes}m"
    if minutes > 0:
        return f"{minutes}m {secs}s"
    return f"{secs}s"


async def _compute_target_counts() -> dict[str, int]:
    async with async_session_factory() as db:
        result = await db.execute(
            select(Career).options(
                selectinload(Career.career_skills).selectinload(CareerSkill.skill),
                selectinload(Career.career_degrees).selectinload(CareerDegree.degree),
                selectinload(Career.career_colleges).selectinload(CareerCollege.college),
                selectinload(Career.career_exams).selectinload(CareerEntranceExam.exam),
                selectinload(Career.career_scholarships).selectinload(CareerScholarship.scholarship),
            )
        )
        careers = result.unique().scalars().all()

        career_chunks = 0
        for career in careers:
            career_dict = {
                "id": career.id,
                "title": career.title,
                "description": career.description,
                "category": career.category,
                "industry": career.industry,
                "work_environment": career.work_environment,
                "weekly_hours": career.weekly_hours,
                "stress_level": career.stress_level,
                "work_life_balance": career.work_life_balance,
                "automation_risk": career.automation_risk,
                "travel_requirement": career.travel_requirement,
                "salary_currency": career.salary_currency,
                "entry_level_salary": career.entry_level_salary,
                "mid_level_salary": career.mid_level_salary,
                "senior_level_salary": career.senior_level_salary,
                "skills": [{"name": cs.skill.name, "category": cs.skill.category} for cs in career.career_skills],
                "degrees": [{"name": cd.degree.name, "level": cd.degree.level} for cd in career.career_degrees],
                "colleges": [{"name": cc.college.name} for cc in career.career_colleges],
                "exams": [{"name": ce.exam.name} for ce in career.career_exams],
                "scholarships": [{"name": cs.scholarship.name} for cs in career.career_scholarships],
            }
            career_chunks += len(chunk_career(career_dict))

        skill_count = (await db.execute(select(func.count(Skill.id)))).scalar() or 0
        degree_count = (await db.execute(select(func.count(Degree.id)))).scalar() or 0
        college_count = (await db.execute(select(func.count(College.id)))).scalar() or 0
        scholarship_count = (await db.execute(select(func.count(Scholarship.id)))).scalar() or 0
        exam_count = (await db.execute(select(func.count(EntranceExam.id)))).scalar() or 0

        return {
            "career": int(career_chunks),
            "skill": int(skill_count),
            "degree": int(degree_count),
            "college": int(college_count),
            "scholarship": int(scholarship_count),
            "exam": int(exam_count),
        }


async def _fetch_latest_counts(source: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    source_types = SOURCE_TYPES if source == "all" else (source,)

    async with async_session_factory() as db:
        for source_type in source_types:
            max_version = (
                await db.execute(
                    select(func.max(DocumentEmbedding.version)).where(
                        DocumentEmbedding.source_type == source_type,
                    )
                )
            ).scalar()

            if max_version is None:
                counts[source_type] = 0
                continue

            count = (
                await db.execute(
                    select(func.count(DocumentEmbedding.id)).where(
                        DocumentEmbedding.source_type == source_type,
                        DocumentEmbedding.version == max_version,
                    )
                )
            ).scalar() or 0
            counts[source_type] = int(count)

    return counts


def _sum_counts(counts: dict[str, int], source: str) -> int:
    if source == "all":
        return sum(counts.values())
    return counts.get(source, 0)


def _sum_targets(targets: dict[str, int], source: str) -> int:
    if source == "all":
        return sum(targets.values())
    return targets.get(source, 0)


async def _run() -> None:
    args = _parse_args()

    print("Calculating expected target counts...", flush=True)
    targets = await _compute_target_counts()
    target_total = _sum_targets(targets, args.source)

    print("Target counts:", flush=True)
    for source_type in SOURCE_TYPES:
        print(f"  {source_type}: {targets[source_type]}", flush=True)
    if args.source == "all":
        print(f"Tracking all sources -> target {target_total}", flush=True)
    else:
        print(f"Tracking source '{args.source}' -> target {target_total}", flush=True)
    print(flush=True)

    history: deque[tuple[float, int]] = deque(maxlen=max(2, args.window))
    previous_count: int | None = None
    last_progress_at: datetime | None = None
    source_history: dict[str, deque[tuple[float, int]]] = {
        source_type: deque(maxlen=max(2, args.window)) for source_type in SOURCE_TYPES
    }
    source_previous: dict[str, int | None] = {source_type: None for source_type in SOURCE_TYPES}
    source_last_progress_at: dict[str, datetime | None] = {
        source_type: None for source_type in SOURCE_TYPES
    }
    iterations = 0

    while True:
        counts = await _fetch_latest_counts(args.source)
        current = _sum_counts(counts, args.source)
        remaining = max(target_total - current, 0)
        pct = (current / target_total * 100.0) if target_total > 0 else 100.0

        now_monotonic = time.monotonic()
        history.append((now_monotonic, current))

        speed_per_sec = 0.0
        if len(history) >= 2:
            t0, c0 = history[0]
            t1, c1 = history[-1]
            elapsed = max(t1 - t0, 1e-9)
            speed_per_sec = max((c1 - c0) / elapsed, 0.0)

        delta = 0 if previous_count is None else current - previous_count
        previous_count = current

        now_utc = datetime.now(timezone.utc)
        if delta > 0:
            last_progress_at = now_utc

        eta_seconds = (remaining / speed_per_sec) if speed_per_sec > 0 else None

        stalled_note = ""
        if last_progress_at is not None and delta == 0:
            idle = now_utc - last_progress_at
            if idle >= timedelta(seconds=max(30.0, args.interval * 2)):
                stalled_note = f" stalled_for={int(idle.total_seconds())}s"

        stamp = now_utc.strftime("%H:%M:%S")
        print(
            f"[{stamp}] current={current}/{target_total} ({pct:.2f}%) "
            f"remaining={remaining} delta={delta:+d} "
            f"speed={speed_per_sec * 60:.2f}/min eta={_format_eta(eta_seconds)}{stalled_note}",
            flush=True,
        )

        if args.source == "all" and args.show_breakdown:
            for source_type in SOURCE_TYPES:
                source_current = counts.get(source_type, 0)
                source_target = targets.get(source_type, 0)
                source_remaining = max(source_target - source_current, 0)

                source_hist = source_history[source_type]
                source_hist.append((now_monotonic, source_current))

                source_speed_per_sec = 0.0
                if len(source_hist) >= 2:
                    st0, sc0 = source_hist[0]
                    st1, sc1 = source_hist[-1]
                    source_elapsed = max(st1 - st0, 1e-9)
                    source_speed_per_sec = max((sc1 - sc0) / source_elapsed, 0.0)

                source_delta = (
                    0
                    if source_previous[source_type] is None
                    else source_current - source_previous[source_type]
                )
                source_previous[source_type] = source_current
                if source_delta > 0:
                    source_last_progress_at[source_type] = now_utc

                source_eta_seconds = (
                    source_remaining / source_speed_per_sec
                    if source_speed_per_sec > 0
                    else None
                )

                source_stalled_note = ""
                source_idle_since = source_last_progress_at[source_type]
                if source_idle_since is not None and source_delta == 0:
                    source_idle = now_utc - source_idle_since
                    if source_idle >= timedelta(seconds=max(30.0, args.interval * 2)):
                        source_stalled_note = f" stalled_for={int(source_idle.total_seconds())}s"

                source_pct = (source_current / source_target * 100.0) if source_target > 0 else 100.0
                print(
                    f"  - {source_type}: {source_current}/{source_target} ({source_pct:.2f}%) "
                    f"remaining={source_remaining} delta={source_delta:+d} "
                    f"speed={source_speed_per_sec * 60:.2f}/min eta={_format_eta(source_eta_seconds)}{source_stalled_note}",
                    flush=True,
                )

        if current >= target_total:
            print("Target reached.", flush=True)
            return

        iterations += 1
        if args.max_iterations > 0 and iterations >= args.max_iterations:
            print("Stopped due to --max-iterations limit.", flush=True)
            return

        await asyncio.sleep(max(0.5, args.interval))


if __name__ == "__main__":
    asyncio.run(_run())
