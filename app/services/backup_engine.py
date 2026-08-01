"""AI-powered backup plan generation engine.

Generates intelligent alternative career paths with trade-offs,
probability of success, and transition difficulty.
"""
import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.logging import logger
from app.models.backup import BackupPlan, BackupScenario
from app.models.career import Career
from app.models.profile import Profile
from app.models.user import User
from app.services.ai.client import get_ai_client
from app.services.career_service import find_career_by_title
from app.services.progress_store import ProgressReporter
from app.services.retrieval_engine import get_relevant_knowledge
from app.utils.exceptions import BadRequestException, NotFoundException, safe_flush

settings = get_settings()


BACKUP_SYSTEM_PROMPT = """You are an expert career strategist specializing in backup planning and career transitions.

Generate intelligent alternative career paths with realistic assessments.

For each scenario, provide:
- career_title: alternative career title
- description: why this is a good alternative
- trade_offs: what the user gains and loses compared to primary choice
- transition_difficulty: easy/moderate/hard/very_hard
- estimated_transition_months: realistic timeline
- probability_of_success: percentage
- difficulty: explanation of difficulty level
- why_recommended: specific reasoning

Respond with valid JSON only. No markdown formatting."""


async def generate_backup_plan(
    db: AsyncSession,
    user: User,
    career_id: UUID,
    max_scenarios: int = 5,
    progress_token: str | None = None,
) -> BackupPlan:
    """Generate AI-powered backup plans for a career."""
    reporter = ProgressReporter(progress_token, str(user.id))
    try:
        return await _generate_backup_plan_inner(
            db, user, career_id, max_scenarios, reporter
        )
    except Exception as e:
        reporter.report(0, "Failed", f"Generation failed: {str(e)[:200]}", status="failed")
        raise


async def _generate_backup_plan_inner(
    db: AsyncSession,
    user: User,
    career_id: UUID,
    max_scenarios: int,
    reporter: ProgressReporter,
) -> BackupPlan:
    """Generate AI-powered backup plans for a career."""
    reporter.report(2, "Starting", "Preparing your backup plan")
    career = await db.get(Career, career_id)
    if not career:
        raise NotFoundException(detail="Career not found")

    profile_data = {}
    result = await db.execute(
        select(Profile).where(Profile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if profile:
        profile_data = {
            "education_level": profile.education_level,
            "years_experience": profile.years_experience,
            "current_field": profile.current_field,
            "skills": profile.skills,
            "interests": profile.interests,
        }

    reporter.report(15, "Gathering your profile", "Reading your profile and background")
    search_query = f"{career.title} alternative careers similar jobs transitions"
    reporter.report(25, "Searching career knowledge base", "Finding relevant alternative careers")
    kb_context = await get_relevant_knowledge(db, search_query, max_tokens=1500)

    prompt = f"""Generate {max_scenarios} intelligent backup plan alternatives for a career as {career.title}.

## Primary Career
- Title: {career.title}
- Description: {career.description[:500] if career.description else 'N/A'}
- Category: {career.category or 'N/A'}
- Industry: {career.industry or 'N/A'}
- Salary: {career.average_salary or 'N/A'}
- Growth: {career.growth_outlook or 'N/A'}
- Demand: {career.demand_level or 'N/A'}

## User Profile
{json.dumps(profile_data, indent=2) if profile_data else "No profile data"}

## Knowledge Base Context
{kb_context if kb_context else "No additional context"}

Generate alternatives ranging from closely related to more distant but still leveraging the user's background.

Respond with JSON:
{{
  "title": "Backup Plan for {career.title}",
  "description": "Overview of backup strategies",
  "scenarios": [
    {{
      "career_title": "Alternative Career Title",
      "scenario_name": "Brief name",
      "description": "Why this is a good alternative",
      "trade_offs": {{
        "gains": ["what user gains"],
        "loses": ["what user loses"]
      }},
      "transition_difficulty": "moderate",
      "estimated_transition_months": 12,
      "probability_of_success": 75,
      "difficulty": "explanation",
      "why_recommended": "specific reasoning based on user profile"
    }}
  ]
}}"""

    ai_client = get_ai_client()
    reporter.report(55, "Analyzing with AI", "Comparing alternative careers — this usually takes 30-60 seconds")
    try:
        response = await ai_client.generate(
            prompt=prompt,
            system_prompt=BACKUP_SYSTEM_PROMPT,
            user_id=str(user.id),
            max_tokens=settings.AI_GENERATION_MAX_TOKENS,
            reasoning_effort=settings.AI_REASONING_EFFORT,
            response_format="json_object" if settings.AI_GENERATION_JSON_MODE else None,
        )
        parsed = json.loads(response)
    except Exception as e:
        logger.error("Backup plan generation failed: %s", str(e)[:200])
        raise BadRequestException(detail=f"Failed to generate backup plan: {str(e)[:200]}")

    reporter.report(85, "Building your backup plan", "Saving your alternative paths")

    plan = BackupPlan(
        user_id=user.id,
        title=parsed.get("title", f"Backup Plan for {career.title}"),
        description=parsed.get("description", ""),
        status="active",
    )
    db.add(plan)
    await safe_flush(db)

    for scenario_data in parsed.get("scenarios", [])[:max_scenarios]:
        career_title = scenario_data.get("career_title", "")
        alt_career = await find_career_by_title(db, career_title)
        if not alt_career:
            continue

        reasoning = {
            "trade_offs": scenario_data.get("trade_offs", {}),
            "probability_of_success": scenario_data.get("probability_of_success", 50),
            "difficulty": scenario_data.get("difficulty", ""),
            "why_recommended": scenario_data.get("why_recommended", ""),
        }

        scenario = BackupScenario(
            backup_plan_id=plan.id,
            career_id=alt_career.id,
            scenario_name=scenario_data.get("scenario_name", career_title),
            description=scenario_data.get("description", ""),
            transition_difficulty=scenario_data.get("transition_difficulty", "moderate"),
            estimated_transition_months=scenario_data.get("estimated_transition_months"),
            reasoning=json.dumps(reasoning),
        )
        db.add(scenario)

    await safe_flush(db)

    result = await db.execute(
        select(BackupPlan)
        .options(selectinload(BackupPlan.scenarios))
        .where(BackupPlan.id == plan.id)
    )
    reporter.report(100, "Done", "Backup plan ready", status="succeeded")
    return result.unique().scalar_one()
