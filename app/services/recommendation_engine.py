"""AI-powered recommendation engine.

Generates personalized career recommendations using:
- User Profile (skills, interests, education)
- Portfolio (achievements, projects)
- Conversation Memory
- Knowledge Base (retrieved context via RAG)
- AI reasoning
"""
import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.logging import logger
from app.models.career import Career
from app.models.portfolio import PortfolioItem
from app.models.profile import Profile, ProfileVersion
from app.models.recommendation import Recommendation, RecommendationItem
from app.models.user import User
from app.services.ai.client import get_ai_client
from app.services.career_service import find_career_by_title
from app.services.progress_store import ProgressReporter
from app.services.retrieval_engine import get_relevant_knowledge, compress_context, semantic_search
from app.utils.exceptions import BadRequestException, safe_flush

settings = get_settings()


RECOMMENDATION_SYSTEM_PROMPT = """You are an expert career guidance counselor with deep knowledge of careers, skills, education paths, and industry trends.

Your task is to provide personalized career recommendations based on the user's profile, portfolio, and retrieved knowledge base context.

For each recommendation, provide:
- career_title: exact career title from the knowledge base
- match_score: 0-100 percentage match
- confidence: high/medium/low
- strengths: list of user's strengths matching this career
- weaknesses: list of gaps the user needs to address
- missing_skills: skills the user needs to develop
- suggested_degrees: relevant degrees
- suggested_colleges: relevant colleges
- suggested_certifications: relevant certifications
- reasoning: detailed explanation

After the recommendations, provide a profile_suggestions object:
- skills: list of up to 10 short skill names the user should develop based on the recommended careers
- interests: list of up to 8 interests aligned with the recommended careers
- target_fields: list of up to 8 fields or roles aligned with the recommended careers

Respond with valid JSON only. No markdown formatting."""


async def generate_recommendation(
    db: AsyncSession,
    user: User,
    include_profile: bool = True,
    max_results: int = 10,
    progress_token: str | None = None,
) -> Recommendation:
    """Generate AI-powered career recommendations."""
    reporter = ProgressReporter(progress_token, str(user.id))
    try:
        return await _generate_recommendation_inner(
            db, user, include_profile, max_results, reporter
        )
    except Exception as e:
        reporter.report(0, "Failed", f"Generation failed: {str(e)[:200]}", status="failed")
        raise


async def _generate_recommendation_inner(
    db: AsyncSession,
    user: User,
    include_profile: bool,
    max_results: int,
    reporter: ProgressReporter,
) -> Recommendation:
    """Generate AI-powered career recommendations."""
    reporter.report(2, "Starting", "Preparing your personalized analysis")
    profile_data = {}
    portfolio_data = []

    if include_profile:
        result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()
        if profile:
            profile_data = {
                "full_name": profile.full_name,
                "education_level": profile.education_level,
                "years_experience": profile.years_experience,
                "current_field": profile.current_field,
                "target_fields": profile.target_fields,
                "skills": profile.skills,
                "interests": profile.interests,
                "bio": profile.bio,
            }

    result = await db.execute(
        select(PortfolioItem).where(
            PortfolioItem.user_id == user.id,
            PortfolioItem.deleted_at.is_(None),
        )
    )
    items = result.scalars().all()
    portfolio_data = [
        {"title": i.title, "description": i.description, "item_type": i.item_type, "skills_used": i.skills_used}
        for i in items
    ]

    reporter.report(10, "Gathering your profile", "Reading your profile and portfolio")
    search_query = _build_search_query(profile_data, portfolio_data)
    reporter.report(20, "Searching career knowledge base", "Finding relevant careers and insights")
    kb_context = await get_relevant_knowledge(db, search_query, max_tokens=2000)

    result = await db.execute(select(Career.title).order_by(Career.title))
    career_titles = [r[0] for r in result.all()]
    career_titles_list = "\n".join(f"- {t}" for t in career_titles)

    prompt = f"""Based on the following user profile and knowledge base context, generate {max_results} personalized career recommendations.

You MUST choose career titles ONLY from the list below. Do NOT invent titles that are not in this list.

Available Career Titles:
{career_titles_list}

## User Profile
{json.dumps(profile_data, indent=2) if profile_data else "No profile available"}

## Portfolio
{json.dumps(portfolio_data, indent=2) if portfolio_data else "No portfolio items"}

## Knowledge Base Context
{kb_context if kb_context else "No relevant knowledge base data found"}

Respond with a JSON object:
{{
  "recommendations": [
    {{
      "career_title": "...",
      "match_score": 85,
      "confidence": "high",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "missing_skills": ["..."],
      "suggested_degrees": ["..."],
      "suggested_colleges": ["..."],
      "suggested_certifications": ["..."],
      "reasoning": "..."
    }}
  ],
  "profile_suggestions": {{
    "skills": ["..."],
    "interests": ["..."],
    "target_fields": ["..."]
  }},
  "summary": "Overall recommendation summary"
}}"""

    ai_client = get_ai_client()
    reporter.report(55, "Analyzing with AI", "Comparing your profile against careers — this usually takes 30-60 seconds")
    try:
        response = await ai_client.generate(
            prompt=prompt,
            system_prompt=RECOMMENDATION_SYSTEM_PROMPT,
            user_id=str(user.id),
            max_tokens=settings.AI_GENERATION_MAX_TOKENS,
            reasoning_effort=settings.AI_REASONING_EFFORT,
            response_format="json_object" if settings.AI_GENERATION_JSON_MODE else None,
        )
        parsed = json.loads(response)
    except Exception as e:
        logger.error("Recommendation generation failed: %s", str(e)[:200])
        raise BadRequestException(detail=f"Failed to generate recommendations: {str(e)[:200]}")

    reporter.report(85, "Building your recommendations", "Saving your best matches")

    recommendation = Recommendation(
        user_id=user.id,
        title="AI Career Recommendations",
        summary=parsed.get("summary", ""),
        status="completed",
    )
    db.add(recommendation)
    await safe_flush(db)

    rec_items = parsed.get("recommendations", [])
    for idx, item in enumerate(rec_items[:max_results]):
        career_title = item.get("career_title", "")
        career = await find_career_by_title(db, career_title)
        if not career:
            continue

        rec_item = RecommendationItem(
            recommendation_id=recommendation.id,
            career_id=career.id,
            match_score=float(item.get("match_score", 50)),
            reasoning=json.dumps({
                "confidence": item.get("confidence", "medium"),
                "strengths": item.get("strengths", []),
                "weaknesses": item.get("weaknesses", []),
                "missing_skills": item.get("missing_skills", []),
                "suggested_degrees": item.get("suggested_degrees", []),
                "suggested_colleges": item.get("suggested_colleges", []),
                "suggested_certifications": item.get("suggested_certifications", []),
                "reasoning": item.get("reasoning", ""),
            }),
            rank=idx + 1,
        )
        db.add(rec_item)

    await safe_flush(db)

    try:
        await _apply_profile_suggestions(db, user, parsed.get("profile_suggestions") or {})
    except Exception as e:
        logger.warning("Failed to apply profile suggestions: %s", str(e)[:200])

    result = await db.execute(
        select(Recommendation)
        .options(selectinload(Recommendation.items).selectinload(RecommendationItem.career))
        .where(Recommendation.id == recommendation.id)
    )
    reporter.report(100, "Done", "Recommendations ready", status="succeeded")
    return result.unique().scalar_one()


def _clean_suggestions(items: object, limit: int = 12) -> list[str]:
    if not isinstance(items, list):
        return []
    seen: set[str] = set()
    cleaned: list[str] = []
    for raw in items:
        if not isinstance(raw, str):
            continue
        name = raw.strip()
        if not name or len(name) > 120:
            continue
        key = name.casefold()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(name)
        if len(cleaned) >= limit:
            break
    return cleaned


async def _apply_profile_suggestions(
    db: AsyncSession,
    user: User,
    suggestions: dict,
) -> None:
    """Merge AI-suggested skills/interests/target fields into the user's profile."""
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        return

    changes: dict = {}

    skills = dict(profile.skills) if profile.skills else {}
    for name in _clean_suggestions(suggestions.get("skills"), limit=15):
        if name not in skills:
            skills[name] = "beginner"
    if len(skills) > len((profile.skills or {})):
        changes["skills"] = skills

    interests = dict(profile.interests) if profile.interests else {}
    for name in _clean_suggestions(suggestions.get("interests"), limit=12):
        if name not in interests:
            interests[name] = "interested"
    if len(interests) > len((profile.interests or {})):
        changes["interests"] = interests

    target_fields = dict(profile.target_fields) if profile.target_fields else {}
    for name in _clean_suggestions(suggestions.get("target_fields"), limit=12):
        if name not in target_fields:
            target_fields[name] = "interested"
    if len(target_fields) > len((profile.target_fields or {})):
        changes["target_fields"] = target_fields

    if not changes:
        return

    for field, value in changes.items():
        setattr(profile, field, value)

    snapshot = {}
    for col in Profile.__table__.columns:
        if col.name not in ("id", "user_id", "created_at", "updated_at"):
            val = getattr(profile, col.name)
            snapshot[col.name] = str(val) if val is not None else None
    max_ver = await db.execute(
        select(ProfileVersion.version_number)
        .where(ProfileVersion.profile_id == profile.id)
        .order_by(ProfileVersion.version_number.desc())
        .limit(1)
    )
    last_ver = max_ver.scalar() or 0
    db.add(ProfileVersion(
        profile_id=profile.id,
        version_number=last_ver + 1,
        snapshot=snapshot,
    ))
    await safe_flush(db)


def _build_search_query(profile_data: dict, portfolio_data: list[dict]) -> str:
    parts = []
    if profile_data.get("interests"):
        if isinstance(profile_data["interests"], list):
            parts.append(f"interests: {', '.join(str(i) for i in profile_data['interests'][:5])}")
        elif isinstance(profile_data["interests"], dict):
            parts.append(f"interests: {', '.join(str(v) for v in list(profile_data['interests'].values())[:5])}")
    if profile_data.get("skills"):
        if isinstance(profile_data["skills"], list):
            parts.append(f"skills: {', '.join(str(s) for s in profile_data['skills'][:5])}")
        elif isinstance(profile_data["skills"], dict):
            parts.append(f"skills: {', '.join(str(k) for k in list(profile_data['skills'].keys())[:5])}")
    if profile_data.get("current_field"):
        parts.append(f"current field: {profile_data['current_field']}")
    if profile_data.get("target_fields"):
        if isinstance(profile_data["target_fields"], list):
            parts.append(f"target fields: {', '.join(str(f) for f in profile_data['target_fields'][:3])}")
    if portfolio_data:
        for p in portfolio_data[:3]:
            if p.get("title"):
                parts.append(p["title"])

    return " ".join(parts) if parts else "career guidance"


async def compare_careers(
    db: AsyncSession,
    career_id_1: UUID,
    career_id_2: UUID,
) -> dict:
    """Compare two careers using AI reasoning."""
    career1 = await db.get(Career, career_id_1)
    career2 = await db.get(Career, career_id_2)

    if not career1 or not career2:
        from app.utils.exceptions import NotFoundException
        raise NotFoundException(detail="Career not found")

    prompt = f"""Compare these two careers in detail:

Career 1: {career1.title}
- Description: {career1.description[:500] if career1.description else 'N/A'}
- Category: {career1.category or 'N/A'}
- Industry: {career1.industry or 'N/A'}
- Average Salary: {career1.average_salary or 'N/A'}
- Entry Salary: {career1.entry_level_salary or 'N/A'}
- Senior Salary: {career1.senior_level_salary or 'N/A'}
- Growth Outlook: {career1.growth_outlook or 'N/A'}
- Demand Level: {career1.demand_level or 'N/A'}
- Work Environment: {career1.work_environment or 'N/A'}
- Stress Level: {career1.stress_level or 'N/A'}
- Work-Life Balance: {career1.work_life_balance or 'N/A'}
- Automation Risk: {career1.automation_risk or 'N/A'}

Career 2: {career2.title}
- Description: {career2.description[:500] if career2.description else 'N/A'}
- Category: {career2.category or 'N/A'}
- Industry: {career2.industry or 'N/A'}
- Average Salary: {career2.average_salary or 'N/A'}
- Entry Salary: {career2.entry_level_salary or 'N/A'}
- Senior Salary: {career2.senior_level_salary or 'N/A'}
- Growth Outlook: {career2.growth_outlook or 'N/A'}
- Demand Level: {career2.demand_level or 'N/A'}
- Work Environment: {career2.work_environment or 'N/A'}
- Stress Level: {career2.stress_level or 'N/A'}
- Work-Life Balance: {career2.work_life_balance or 'N/A'}
- Automation Risk: {career2.automation_risk or 'N/A'}

Provide a detailed comparison with JSON:
{{
  "career_1_summary": "...",
  "career_2_summary": "...",
  "salary_comparison": "...",
  "growth_comparison": "...",
  "work_life_comparison": "...",
  "skills_comparison": "...",
  "recommendation": "...",
  "best_for_different_goals": {{
    "for_stability": "...",
    "for_growth": "...",
    "for_salary": "...",
    "for_work_life_balance": "..."
  }}
}}"""

    ai_client = get_ai_client()
    try:
        response = await ai_client.generate(
            prompt=prompt,
            user_id=None,
            max_tokens=settings.AI_COMPARE_MAX_TOKENS,
            reasoning_effort=settings.AI_REASONING_EFFORT,
            response_format="json_object" if settings.AI_GENERATION_JSON_MODE else None,
        )
        parsed = json.loads(response)
    except Exception as e:
        parsed = {
            "career_1_summary": career1.description[:200] if career1.description else "",
            "career_2_summary": career2.description[:200] if career2.description else "",
            "recommendation": f"Both {career1.title} and {career2.title} are viable career paths.",
        }

    return {
        "career_1": {"id": str(career1.id), "title": career1.title},
        "career_2": {"id": str(career2.id), "title": career2.title},
        "comparison": parsed,
        "recommendation": parsed.get("recommendation", ""),
    }
