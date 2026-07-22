"""
Dummy Data Loader for Tophexity Backend

Usage:
    python scripts/load_dummy_data.py          # Load all dummy data
    python scripts/load_dummy_data.py --reset  # Clear all data
    python scripts/load_dummy_data.py --seed   # Load only careers/skills data

Requires DATABASE_URL in .env or environment.
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import async_session_factory, engine
from app.core.security import get_password_hash
from app.models import (
    BackupPlan, BackupScenario, Career, CareerCollege, CareerDegree,
    CareerEntranceExam, CareerResource, CareerScholarship, CareerSkill,
    ChatMessage, ChatSession, College, Degree, EntranceExam, PortfolioItem,
    Profile, ProfileVersion, Recommendation, RecommendationItem, Resource,
    Roadmap, RoadmapStep, Scholarship, Skill, User,
)
from app.models.enums import ChatMessageRole, SkillLevel, UserRole

DUMMY_DIR = Path(__file__).resolve().parent.parent / "dummy_data"


def load_json(name: str) -> dict | list:
    path = DUMMY_DIR / name
    if not path.exists():
        print(f"  WARNING: {path} not found, skipping")
        return [] if name.endswith("s.json") else {}
    with open(path) as f:
        return json.load(f)


async def clear_all(session):
    print("Clearing existing data...")
    tables = [
        ChatMessage, ChatSession, BackupScenario, BackupPlan,
        RoadmapStep, Roadmap, RecommendationItem, Recommendation,
        PortfolioItem, ProfileVersion, Profile,
        CareerResource, CareerScholarship, CareerEntranceExam,
        CareerDegree, CareerSkill, CareerCollege,
        Resource, Scholarship, EntranceExam, College, Degree, Skill,
        Career, User,
    ]
    for table in tables:
        await session.execute(table.__table__.delete())
    await session.flush()
    print("  All data cleared.")


async def load_users(session) -> dict[str, User]:
    users_data = load_json("users.json")
    if not users_data:
        return {}
    print(f"Loading {len(users_data)} users...")
    email_to_user = {}
    for u in users_data:
        user = User(
            email=u["email"],
            hashed_password=get_password_hash(u["password"]),
            is_active=True,
            is_verified=True,
            role=UserRole.USER,
        )
        session.add(user)
        await session.flush()
        email_to_user[u["email"]] = user
        print(f"  User: {u['email']} (id={user.id})")
    return email_to_user


async def load_profiles(session, email_to_user: dict):
    profiles_data = load_json("profiles.json")
    if not profiles_data:
        return
    print(f"Loading {len(profiles_data)} profiles...")
    for email, pdata in profiles_data.items():
        user = email_to_user.get(email)
        if not user:
            print(f"  SKIP profile for {email} (user not found)")
            continue
        profile = Profile(user_id=user.id, **pdata)
        session.add(profile)
        await session.flush()
        version = ProfileVersion(
            profile_id=profile.id,
            version_number=1,
            snapshot=pdata,
        )
        session.add(version)
        print(f"  Profile: {pdata['full_name']}")


async def load_careers(session) -> dict[str, Career]:
    careers_data = load_json("careers.json")
    if not careers_data:
        return {}
    print(f"Loading {len(careers_data)} careers...")
    title_to_career = {}
    for c in careers_data:
        career = Career(
            title=c["title"],
            description=c["description"],
            average_salary=c.get("average_salary"),
            growth_outlook=c.get("growth_outlook"),
            demand_level=c.get("demand_level"),
            required_education=c.get("required_education"),
            typical_skills=c.get("typical_skills"),
        )
        session.add(career)
        await session.flush()
        title_to_career[c["title"]] = career
        print(f"  Career: {c['title']}")
    return title_to_career


async def load_skills_and_link(session, title_to_career: dict):
    skills_data = [
        ("Python", "Programming"), ("JavaScript", "Programming"), ("TypeScript", "Programming"),
        ("Go", "Programming"), ("R", "Programming"), ("SQL", "Data"),
        ("React", "Frontend"), ("FastAPI", "Backend"), ("Django", "Backend"),
        ("Docker", "DevOps"), ("Kubernetes", "DevOps"), ("AWS", "Cloud"),
        ("Azure", "Cloud"), ("Terraform", "DevOps"), ("Git", "Tools"),
        ("Machine Learning", "AI"), ("Statistics", "Data"),
        ("System Design", "Architecture"), ("Linux", "DevOps"), ("CI/CD", "DevOps"),
    ]
    print(f"Loading {len(skills_data)} skills...")
    skills = []
    for name, category in skills_data:
        skill = Skill(name=name, category=category)
        session.add(skill)
        await session.flush()
        skills.append(skill)

    career_skill_map = {
        "Software Engineer": [0, 1, 5, 14, 17],
        "Data Scientist": [0, 4, 5, 15, 16],
        "Cloud Architect": [11, 12, 10, 13, 17],
        "DevOps Engineer": [9, 10, 18, 13, 19],
        "AI/ML Engineer": [0, 15, 16, 10, 17],
    }
    print("Linking careers to skills...")
    for title, skill_indices in career_skill_map.items():
        career = title_to_career.get(title)
        if not career:
            continue
        for si in skill_indices:
            cs = CareerSkill(career_id=career.id, skill_id=skills[si].id, level=SkillLevel.ADVANCED)
            session.add(cs)

    degrees_data = [
        ("B.Tech Computer Science", "bachelor", "Computer Science"),
        ("B.Sc Data Science", "bachelor", "Data Science"),
        ("M.Tech Computer Science", "master", "Computer Science"),
        ("MBA", "master", "Business Administration"),
    ]
    print(f"Loading {len(degrees_data)} degrees...")
    degrees = []
    for name, level, field in degrees_data:
        degree = Degree(name=name, level=level, field=field)
        session.add(degree)
        await session.flush()
        degrees.append(degree)

    career_degree_map = {
        "Software Engineer": 0, "Data Scientist": 1,
        "Cloud Architect": 0, "DevOps Engineer": 0,
        "Product Manager": 3,
    }
    for title, di in career_degree_map.items():
        career = title_to_career.get(title)
        if career and di < len(degrees):
            cd = CareerDegree(career_id=career.id, degree_id=degrees[di].id, is_required=True)
            session.add(cd)


async def load_portfolio(session, email_to_user: dict):
    portfolio_data = load_json("portfolio.json")
    if not portfolio_data:
        return
    print(f"Loading {len(portfolio_data)} portfolio items...")
    for item_data in portfolio_data:
        email = item_data.pop("email")
        user = email_to_user.get(email)
        if not user:
            continue
        item = PortfolioItem(user_id=user.id, **item_data)
        session.add(item)
    print(f"  Portfolio items created for {len(set(p['email'] for p in portfolio_data))} users")


async def load_recommendations(session, email_to_user: dict, title_to_career: dict):
    recs_data = load_json("recommendations.json")
    if not recs_data:
        return
    print(f"Loading recommendations...")
    for email, rdata in recs_data.items():
        user = email_to_user.get(email)
        if not user:
            continue
        rec = Recommendation(
            user_id=user.id,
            title=rdata["title"],
            summary=rdata["summary"],
            status="completed",
        )
        session.add(rec)
        await session.flush()
        for item_data in rdata["items"]:
            career = title_to_career.get(item_data["career_title"])
            if not career:
                continue
            ri = RecommendationItem(
                recommendation_id=rec.id,
                career_id=career.id,
                match_score=item_data["match_score"],
                reasoning=item_data.get("reasoning"),
                rank=item_data["rank"],
            )
            session.add(ri)
        print(f"  Recommendation for {email}: {rdata['title']}")


async def load_roadmaps(session, email_to_user: dict, title_to_career: dict):
    roadmaps_data = load_json("roadmaps.json")
    if not roadmaps_data:
        return
    print(f"Loading roadmaps...")
    for email, rmdata in roadmaps_data.items():
        user = email_to_user.get(email)
        if not user:
            continue
        career = title_to_career.get(rmdata.get("career_title"))
        if not career:
            continue
        roadmap = Roadmap(
            user_id=user.id,
            career_id=career.id,
            title=rmdata["title"],
            description=rmdata.get("description"),
            status="active",
            estimated_duration_months=rmdata.get("estimated_duration_months"),
        )
        session.add(roadmap)
        await session.flush()
        for step_data in rmdata.get("steps", []):
            step = RoadmapStep(
                roadmap_id=roadmap.id,
                title=step_data["title"],
                description=step_data.get("description"),
                step_order=step_data["step_order"],
                duration_months=step_data.get("duration_months"),
                resources=step_data.get("resources"),
            )
            session.add(step)
        print(f"  Roadmap for {email}: {rmdata['title']}")


async def load_backup_plans(session, email_to_user: dict, title_to_career: dict):
    backups_data = load_json("backupplans.json")
    if not backups_data:
        return
    print(f"Loading backup plans...")
    for email, bpdata in backups_data.items():
        user = email_to_user.get(email)
        if not user:
            continue
        bp = BackupPlan(
            user_id=user.id,
            title=bpdata["title"],
            description=bpdata.get("description"),
            status="active",
        )
        session.add(bp)
        await session.flush()
        for sc_data in bpdata.get("scenarios", []):
            career = title_to_career.get(sc_data.get("career_title"))
            if not career:
                continue
            scenario = BackupScenario(
                backup_plan_id=bp.id,
                career_id=career.id,
                scenario_name=sc_data["scenario_name"],
                description=sc_data.get("description"),
                transition_difficulty=sc_data.get("transition_difficulty"),
                estimated_transition_months=sc_data.get("estimated_transition_months"),
                reasoning=sc_data.get("reasoning"),
            )
            session.add(scenario)
        print(f"  Backup plan for {email}: {bpdata['title']}")


async def load_chat(session, email_to_user: dict):
    chat_data = load_json("chat.json")
    if not chat_data:
        return
    print(f"Loading chat sessions...")
    for email, sessions in chat_data.items():
        user = email_to_user.get(email)
        if not user:
            continue
        for sdata in sessions:
            chat_session = ChatSession(user_id=user.id, title=sdata.get("title"))
            session.add(chat_session)
            await session.flush()
            for mdata in sdata.get("messages", []):
                msg = ChatMessage(
                    session_id=chat_session.id,
                    role=ChatMessageRole(mdata["role"]),
                    content=mdata["content"],
                )
                session.add(msg)
            print(f"  Chat session for {email}: {sdata.get('title')} ({len(sdata.get('messages', []))} messages)")


async def run_load():
    async with async_session_factory() as session:
        async with session.begin():
            email_to_user = await load_users(session)
            await load_profiles(session, email_to_user)
            title_to_career = await load_careers(session)
            await load_skills_and_link(session, title_to_career)
            await load_portfolio(session, email_to_user)
            await load_recommendations(session, email_to_user, title_to_career)
            await load_roadmaps(session, email_to_user, title_to_career)
            await load_backup_plans(session, email_to_user, title_to_career)
            await load_chat(session, email_to_user)
    print("\n" + "=" * 60)
    print("Dummy data loaded successfully!")
    print("=" * 60)
    print(f"\nTest credentials:")
    print(f"  Email: alice@example.com  Password: password123")
    print(f"  Email: bob@example.com    Password: password123")
    print(f"  Email: charlie@example.com  Password: password123")
    print(f"\nSwagger UI: https://tophexity-func.azurewebsites.net/docs")


async def run_reset():
    async with async_session_factory() as session:
        async with session.begin():
            await clear_all(session)
    print("\nDatabase reset complete. All data cleared.")


async def run_seed():
    async with async_session_factory() as session:
        async with session.begin():
            title_to_career = await load_careers(session)
            await load_skills_and_link(session, title_to_career)
    print("\nSeed data loaded (careers and skills only).")


def main():
    parser = argparse.ArgumentParser(description="Load dummy data into PostgreSQL")
    parser.add_argument("--reset", action="store_true", help="Clear all data")
    parser.add_argument("--seed", action="store_true", help="Load only careers/skills")
    args = parser.parse_args()

    if args.reset:
        asyncio.run(run_reset())
    elif args.seed:
        asyncio.run(run_seed())
    else:
        asyncio.run(run_load())


if __name__ == "__main__":
    main()
