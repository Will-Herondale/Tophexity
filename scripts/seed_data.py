"""
Dummy Data Seed Script for Tophexity Backend

Usage:
    python scripts/seed_data.py

This script seeds the database with test data for frontend development.
It creates: users, profiles, portfolio items, careers, recommendations,
roadmaps, backup plans, and chat sessions.

Ensure DATABASE_URL is set in .env or environment before running.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from uuid import uuid4
from datetime import datetime, timezone

from app.core.security import get_password_hash
from app.core.database import async_session_factory
from app.models import (
    User, Profile, PortfolioItem, Career, Skill, CareerSkill,
    Degree, CareerDegree, College, CareerCollege,
    EntranceExam, CareerEntranceExam, Scholarship, CareerScholarship,
    Resource, CareerResource, Recommendation, RecommendationItem,
    Roadmap, RoadmapStep, BackupPlan, BackupScenario,
    ChatSession, ChatMessage,
)
from app.models.enums import SkillLevel, UserRole, ChatMessageRole


USERS = [
    {"email": "alice@example.com", "password": "password123", "is_active": True, "is_verified": True},
    {"email": "bob@example.com", "password": "password123", "is_active": True, "is_verified": True},
    {"email": "charlie@example.com", "password": "password123", "is_active": True, "is_verified": False},
]

PROFILES = [
    {
        "full_name": "Alice Johnson",
        "headline": "Full-Stack Developer",
        "bio": "Passionate about building scalable web applications.",
        "location": "Hyderabad, India",
        "education_level": "bachelor",
        "years_experience": 3,
        "current_field": "Software Engineering",
        "target_fields": {"primary": "Cloud Architecture", "secondary": "AI/ML"},
        "skills": {"languages": ["Python", "JavaScript", "Go"], "frameworks": ["FastAPI", "React"]},
        "interests": {"topics": ["cloud", "distributed systems", "open source"]},
    },
    {
        "full_name": "Bob Smith",
        "headline": "Data Science Student",
        "bio": "CS student interested in machine learning and data analytics.",
        "location": "Bangalore, India",
        "education_level": "undergraduate",
        "years_experience": 0,
        "current_field": "Computer Science",
        "target_fields": {"primary": "Data Science", "secondary": "Software Engineering"},
        "skills": {"languages": ["Python", "R", "SQL"], "tools": ["Pandas", "Scikit-learn"]},
        "interests": {"topics": ["machine learning", "data visualization"]},
    },
]

CAREERS = [
    {
        "title": "Software Engineer",
        "description": "Design, develop, and maintain software systems. Work with multiple programming languages and frameworks to build scalable applications.",
        "average_salary": 95000,
        "growth_outlook": "above_average",
        "demand_level": "high",
        "required_education": {"minimum": "bachelor", "preferred": "master"},
        "typical_skills": ["Python", "JavaScript", "SQL", "Git", "System Design"],
    },
    {
        "title": "Data Scientist",
        "description": "Analyze complex datasets to extract insights and build predictive models using statistical methods and machine learning.",
        "average_salary": 110000,
        "growth_outlook": "much_above_average",
        "demand_level": "very_high",
        "required_education": {"minimum": "bachelor", "preferred": "master"},
        "typical_skills": ["Python", "R", "SQL", "Machine Learning", "Statistics"],
    },
    {
        "title": "Cloud Architect",
        "description": "Design and oversee cloud computing strategies, ensuring scalability, security, and cost optimization.",
        "average_salary": 130000,
        "growth_outlook": "much_above_average",
        "demand_level": "very_high",
        "required_education": {"minimum": "bachelor"},
        "typical_skills": ["AWS", "Azure", "Kubernetes", "Terraform", "Networking"],
    },
    {
        "title": "DevOps Engineer",
        "description": "Bridge development and operations by automating CI/CD pipelines, infrastructure, and monitoring.",
        "average_salary": 115000,
        "growth_outlook": "above_average",
        "demand_level": "high",
        "required_education": {"minimum": "bachelor"},
        "typical_skills": ["Docker", "Kubernetes", "CI/CD", "Linux", "Terraform"],
    },
    {
        "title": "Product Manager",
        "description": "Lead product strategy and execution, working with engineering, design, and business teams.",
        "average_salary": 120000,
        "growth_outlook": "average",
        "demand_level": "high",
        "required_education": {"minimum": "bachelor", "preferred": "MBA"},
        "typical_skills": ["Strategy", "Analytics", "Communication", "Agile", "Roadmapping"],
    },
]

SKILLS = [
    ("Python", "Programming"), ("JavaScript", "Programming"), ("TypeScript", "Programming"),
    ("Go", "Programming"), ("R", "Programming"), ("SQL", "Data"),
    ("React", "Frontend"), ("FastAPI", "Backend"), ("Django", "Backend"),
    ("Docker", "DevOps"), ("Kubernetes", "DevOps"), ("AWS", "Cloud"),
    ("Azure", "Cloud"), ("Terraform", "DevOps"), ("Git", "Tools"),
    ("Machine Learning", "AI"), ("Statistics", "Data"),
    ("System Design", "Architecture"), ("Linux", "DevOps"), ("CI/CD", "DevOps"),
]

DEGREES = [
    ("B.Tech Computer Science", "bachelor", "Computer Science"),
    ("B.Sc Data Science", "bachelor", "Data Science"),
    ("M.Tech Computer Science", "master", "Computer Science"),
    ("M.Sc Data Science", "master", "Data Science"),
    ("MBA", "master", "Business Administration"),
    ("BBA", "bachelor", "Business Administration"),
]

COLLEGES = [
    {"name": "IIT Hyderabad", "location": "Hyderabad", "ranking": 8},
    {"name": "IIT Bombay", "location": "Mumbai", "ranking": 3},
    {"name": "BITS Pilani", "location": "Pilani", "ranking": 25},
    {"name": "IIIT Hyderabad", "location": "Hyderabad", "ranking": 50},
]

EXAMS = [
    ("JEE Main", "Joint Entrance Examination for engineering admissions"),
    ("GATE", "Graduate Aptitude Test in Engineering"),
    ("CAT", "Common Admission Test for MBA"),
    ("GRE", "Graduate Record Examinations"),
]

SCHOLARSHIPS = [
    {"name": "INSPIRE Scholarship", "amount": 80000, "eligibility": "Top 1% of board exam"},
    {"name": "AICTE Scholarship", "amount": 50000, "eligibility": "Engineering students"},
    {"name": "Reliance Foundation Scholarship", "amount": 200000, "eligibility": "Merit-based"},
]

RESOURCES = [
    {"title": "CS50 by Harvard", "url": "https://cs50.harvard.edu", "resource_type": "course"},
    {"title": "FastAPI Documentation", "url": "https://fastapi.tiangolo.com", "resource_type": "documentation"},
    {"title": "Kaggle Learn", "url": "https://www.kaggle.com/learn", "resource_type": "course"},
]


async def seed():
    async with async_session_factory() as session:
        async with session.begin():
            print("Seeding users...")
            users = []
            for u in USERS:
                user = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    is_active=u["is_active"],
                    is_verified=u["is_verified"],
                    role=UserRole.USER,
                )
                session.add(user)
                await session.flush()
                users.append(user)
                print(f"  Created user: {user.email} (id={user.id})")

            print("Seeding profiles...")
            for i, p in enumerate(PROFILES):
                profile = Profile(user_id=users[i].id, **p)
                session.add(profile)

            print("Seeding careers...")
            careers = []
            for c in CAREERS:
                career = Career(**c)
                session.add(career)
                await session.flush()
                careers.append(career)

            print("Seeding skills...")
            skills = []
            for name, category in SKILLS:
                skill = Skill(name=name, category=category)
                session.add(skill)
                await session.flush()
                skills.append(skill)

            print("Linking careers to skills...")
            career_skill_map = {
                0: [0, 1, 5, 14, 17],  # Software Engineer
                1: [0, 4, 5, 15, 16],  # Data Scientist
                2: [11, 12, 10, 13, 17],  # Cloud Architect
                3: [9, 10, 18, 13, 19],  # DevOps Engineer
                4: [17, 15, 16, 14, 19],  # Product Manager
            }
            for ci, skill_indices in career_skill_map.items():
                for si in skill_indices:
                    cs = CareerSkill(career_id=careers[ci].id, skill_id=skills[si].id, level=SkillLevel.ADVANCED)
                    session.add(cs)

            print("Seeding degrees...")
            degrees = []
            for name, level, field in DEGREES:
                degree = Degree(name=name, level=level, field=field)
                session.add(degree)
                await session.flush()
                degrees.append(degree)

            print("Linking careers to degrees...")
            for ci, di in [(0, 0), (1, 1), (2, 0), (3, 0), (4, 5)]:
                cd = CareerDegree(career_id=careers[ci].id, degree_id=degrees[di].id, is_required=True)
                session.add(cd)

            print("Seeding colleges...")
            colleges = []
            for c in COLLEGES:
                college = College(**c)
                session.add(college)
                await session.flush()
                colleges.append(college)

            print("Seeding entrance exams...")
            exams = []
            for name, desc in EXAMS:
                exam = EntranceExam(name=name, description=desc)
                session.add(exam)
                await session.flush()
                exams.append(exam)

            print("Seeding scholarships...")
            scholarships = []
            for s in SCHOLARSHIPS:
                scholarship = Scholarship(**s)
                session.add(scholarship)
                await session.flush()
                scholarships.append(scholarship)

            print("Seeding resources...")
            resources = []
            for r in RESOURCES:
                resource = Resource(**r)
                session.add(resource)
                await session.flush()
                resources.append(resource)

            print("Seeding recommendations...")
            rec = Recommendation(
                user_id=users[0].id,
                title="Top Career Matches for Alice",
                summary="Based on your full-stack development background and cloud interests.",
                status="completed",
            )
            session.add(rec)
            await session.flush()
            for rank, ci in enumerate([0, 2, 3], 1):
                item = RecommendationItem(
                    recommendation_id=rec.id,
                    career_id=careers[ci].id,
                    match_score=95.0 - (rank * 5),
                    reasoning=f"Strong match based on your skills in {', '.join(SKILLS[career_skill_map[ci][0]:career_skill_map[ci][0]+2][0] for _ in [1])}",
                    rank=rank,
                )
                session.add(item)

            print("Seeding roadmaps...")
            roadmap = Roadmap(
                user_id=users[0].id,
                career_id=careers[2].id,
                title="Path to Cloud Architect",
                description="Step-by-step plan to become a Cloud Architect.",
                status="active",
                estimated_duration_months=24,
            )
            session.add(roadmap)
            await session.flush()
            steps = [
                ("Master Linux & Networking", "Build foundational infrastructure knowledge", 1, 3),
                ("Learn AWS/Azure Fundamentals", "Get cloud certification", 2, 6),
                ("Container Orchestration", "Master Docker and Kubernetes", 3, 6),
                ("Infrastructure as Code", "Learn Terraform and Pulumi", 4, 3),
                ("Architecture Patterns", "Study distributed systems design", 5, 3),
                ("Certification & Job Prep", "Get AWS Solutions Architect cert", 6, 3),
            ]
            for title, desc, order, months in steps:
                step = RoadmapStep(
                    roadmap_id=roadmap.id, title=title, description=desc,
                    step_order=order, duration_months=months,
                )
                session.add(step)

            print("Seeding backup plans...")
            bp = BackupPlan(
                user_id=users[0].id,
                title="Career Contingency Plan",
                description="Alternative paths if primary career doesn't work out.",
                status="active",
            )
            session.add(bp)
            await session.flush()
            scenarios = [
                (careers[1].id, "Switch to Data Science", "medium", 12),
                (careers[3].id, "Move to DevOps", "easy", 6),
                (careers[4].id, "Transition to Product Management", "hard", 18),
            ]
            for ci, name, diff, months in scenarios:
                scenario = BackupScenario(
                    backup_plan_id=bp.id, career_id=careers[ci].id,
                    scenario_name=name, description=f"Alternative: {name}",
                    transition_difficulty=diff, estimated_transition_months=months,
                )
                session.add(scenario)

            print("Seeding chat sessions...")
            chat_session = ChatSession(user_id=users[0].id, title="Career Guidance Chat")
            session.add(chat_session)
            await session.flush()
            messages = [
                (ChatMessageRole.USER, "Hi, I'm looking for career advice."),
                (ChatMessageRole.ASSISTANT, "Hello Alice! I'd be happy to help. Tell me about your background."),
                (ChatMessageRole.USER, "I'm a full-stack developer with 3 years of experience."),
                (ChatMessageRole.ASSISTANT, "That's great! Based on your experience, I'd recommend exploring cloud architecture."),
            ]
            for role, content in messages:
                msg = ChatMessage(session_id=chat_session.id, role=role, content=content)
                session.add(msg)

        print("\nSeed completed successfully!")
        print(f"  Users: {len(USERS)} (email: alice@example.com / password: password123)")
        print(f"  Careers: {len(CAREERS)}")
        print(f"  Skills: {len(SKILLS)}")
        print(f"  Recommendations: 1 with {len([0,2,3])} items")
        print(f"  Roadmaps: 1 with {len(steps)} steps")
        print(f"  Backup Plans: 1 with {len(scenarios)} scenarios")
        print(f"  Chat Sessions: 1 with {len(messages)} messages")


if __name__ == "__main__":
    asyncio.run(seed())
