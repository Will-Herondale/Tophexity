from fastapi import APIRouter

from app.api.v1 import ai, auth, backups, careers, chat, portfolio, recommendations, roadmaps, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
api_router.include_router(careers.router, prefix="/careers", tags=["Careers"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(roadmaps.router, prefix="/roadmaps", tags=["Roadmaps"])
api_router.include_router(backups.router, prefix="/backups", tags=["Backup Plans"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
