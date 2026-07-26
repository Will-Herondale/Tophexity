"""AI-powered roadmap generation engine.

Generates personalized career roadmaps with milestones, timelines,
dependencies, resources, and progress checkpoints.
"""
import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.career import Career
from app.models.profile import Profile
from app.models.user import User
from app.models.roadmap import Roadmap, RoadmapStep
from app.services.ai.client import get_ai_client
from app.services.retrieval_engine import get_relevant_knowledge
from app.utils.exceptions import BadRequestException, NotFoundException, safe_flush


ROADMAP_SYSTEM_PROMPT = """You are an expert career planner and education consultant.

Generate detailed, personalized roadmaps with realistic timelines, milestones, dependencies, and resources.

For each roadmap step, provide:
- title: clear step name
- description: detailed explanation
- step_order: sequential order (1-based)
- duration_months: estimated months for this step
- resources: list of recommended resources (courses, books, certifications)
- dependencies: which prior steps must be completed first
- checkpoints: progress verification criteria

Respond with valid JSON only. No markdown formatting."""


async def generate_roadmap(
    db: AsyncSession,
    user: User,
    career_id: UUID,
    roadmap_type: str = "career",
    custom_duration_months: int | None = None,
) -> Roadmap:
    """Generate an AI-powered personalized roadmap."""
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

    search_query = f"{career.title} career path {roadmap_type} roadmap"
    if profile_data.get("education_level"):
        search_query += f" {profile_data['education_level']}"
    kb_context = await get_relevant_knowledge(db, search_query, max_tokens=1500)

    duration_hint = f"Target duration: {custom_duration_months} months." if custom_duration_months else "Choose a realistic duration."

    prompt = f"""Generate a detailed {roadmap_type} roadmap for becoming a {career.title}.

## Career Information
- Title: {career.title}
- Description: {career.description[:500] if career.description else 'N/A'}
- Category: {career.category or 'N/A'}
- Required Education: {json.dumps(career.required_education) if career.required_education else 'N/A'}
- Required Skills: {json.dumps(career.typical_skills) if career.typical_skills else 'N/A'}
- Growth Outlook: {career.growth_outlook or 'N/A'}
- Demand Level: {career.demand_level or 'N/A'}

## User Profile
{json.dumps(profile_data, indent=2) if profile_data else "No profile data"}

## Knowledge Base Context
{kb_context if kb_context else "No additional context found"}

## Roadmap Type: {roadmap_type}
{duration_hint}

Respond with JSON:
{{
  "title": "Roadmap title",
  "description": "Overall roadmap description",
  "estimated_duration_months": 24,
  "steps": [
    {{
      "title": "Step name",
      "description": "Detailed description of what to do",
      "step_order": 1,
      "duration_months": 6,
      "resources": [
        {{"name": "Resource name", "type": "course/certification/book", "url": "optional URL"}}
      ],
      "dependencies": [],
      "checkpoints": ["How to verify this step is complete"]
    }}
  ]
}}"""

    ai_client = get_ai_client()
    try:
        response = await ai_client.generate_json(
            prompt=prompt,
            system_prompt=ROADMAP_SYSTEM_PROMPT,
            user_id=str(user.id),
        )
        parsed = json.loads(response)
    except Exception as e:
        logger.error("Roadmap generation failed: %s", str(e)[:200])
        raise BadRequestException(detail=f"Failed to generate roadmap: {str(e)[:200]}")

    roadmap = Roadmap(
        user_id=user.id,
        career_id=career_id,
        title=parsed.get("title", f"{career.title} Roadmap"),
        description=parsed.get("description", ""),
        status="active",
        estimated_duration_months=parsed.get("estimated_duration_months"),
    )
    db.add(roadmap)
    await safe_flush(db)

    for step_data in parsed.get("steps", []):
        step = RoadmapStep(
            roadmap_id=roadmap.id,
            title=step_data.get("title", "Step"),
            description=step_data.get("description", ""),
            step_order=step_data.get("step_order", 1),
            duration_months=step_data.get("duration_months"),
            resources=step_data.get("resources"),
        )
        db.add(step)

    await safe_flush(db)

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Roadmap)
        .options(selectinload(Roadmap.steps))
        .where(Roadmap.id == roadmap.id)
    )
    return result.unique().scalar_one()
