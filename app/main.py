from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import logger
from app.middleware.timing import RequestTimingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    from app.services.ai.client import get_ai_client
    client = get_ai_client()
    if client.is_configured:
        logger.info("AI client configured: endpoint=%s deployment=%s",
                     settings.AI_ENDPOINT, settings.AI_DEPLOYMENT_NAME)
    else:
        logger.warning("AI client not configured - AI endpoints will return 503")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


settings = get_settings()


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Backend API for AI-powered career path guidance platform. "
        "Provides user authentication, profile management, career exploration, "
        "AI recommendations, learning roadmaps, backup plans, and career chat.",
        contact={"name": "Tophexity Team", "url": "https://github.com/tophexity"},
        license_info={"name": "MIT"},
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.add_middleware(RequestTimingMiddleware)

    application.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @application.get("/health", tags=["Health"], summary="Health check",
                     description="Returns service health status and version.")
    async def health_check():
        return {"status": "healthy", "version": settings.APP_VERSION}

    @application.get(
        "/health/ai",
        tags=["AI"],
        summary="AI health check",
        description="Verify Azure AI connectivity, deployment, authentication, and latency.",
    )
    async def ai_health_check():
        from app.services.ai.health import check_ai_health
        return await check_ai_health()

    return application


app = create_app()
