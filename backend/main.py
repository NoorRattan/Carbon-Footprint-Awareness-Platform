"""EcoTrack FastAPI application entry point.

Initialises Firebase Admin SDK, configures CORS, rate limiting,
security headers middleware, and registers all API routers.
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import firebase_admin
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from firebase_admin import credentials
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.limiter import limiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

logger = logging.getLogger(__name__)


def _init_firebase() -> None:
    """Initialise Firebase Admin SDK if not already initialised.

    Uses service account key file in development; falls back to Application
    Default Credentials (ADC) in production on Cloud Run.
    """
    if firebase_admin._apps:
        return

    settings = get_settings()
    try:
        cred = credentials.Certificate(settings.firebase_service_account_key)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase initialised with service account file.")
    except Exception:
        # In production on Cloud Run, ADC is available via the service account
        # attached to the instance.
        firebase_admin.initialize_app()
        logger.info("Firebase initialised with Application Default Credentials.")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler — runs on startup and shutdown.

    Args:
        app: The FastAPI application instance.

    Yields:
        None — control returns to FastAPI between startup and shutdown.
    """
    _init_firebase()
    logger.info("EcoTrack API started.")
    yield
    logger.info("EcoTrack API shutting down.")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance.

    Returns:
        Configured FastAPI application with middleware and routers registered.
    """
    settings = get_settings()

    app = FastAPI(
        title="EcoTrack API",
        description="Carbon Footprint Awareness Platform API",
        version="1.0.0",
        lifespan=lifespan,
        # Hide interactive docs in production to reduce attack surface
        docs_url=None if settings.environment == "production" else "/docs",
        redoc_url=None if settings.environment == "production" else "/redoc",
    )

    # Rate limiter state
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS — strict allowlist, NEVER wildcard in production
    allowed_origins = [o.strip() for o in settings.allowed_origins.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # Security headers middleware — applied to every response
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):  # type: ignore[no-untyped-def]
        """Add security headers to every response.

        Args:
            request: Incoming HTTP request.
            call_next: Next middleware or route handler.

        Returns:
            Response with security headers attached.
        """
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

    # Global exception handler — never leak internal errors to clients
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle all unhandled exceptions with a generic 500 response.

        Logs the real error server-side and returns a safe generic message.

        Args:
            request: Incoming HTTP request.
            exc: Unhandled exception.

        Returns:
            JSON response with 500 status and generic error detail.
        """
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."},
        )

    # Register routers — imported here to avoid circular imports during testing
    from app.routes.activities import router as activities_router
    from app.routes.education import router as education_router
    from app.routes.goals import router as goals_router
    from app.routes.insights import router as insights_router
    from app.routes.user import router as user_router

    app.include_router(activities_router, prefix="/api/v1")
    app.include_router(insights_router, prefix="/api/v1")
    app.include_router(goals_router, prefix="/api/v1")
    app.include_router(user_router, prefix="/api/v1")
    app.include_router(education_router, prefix="/api/v1")

    @app.get("/api/v1/health", tags=["health"])
    async def health_check() -> dict:
        """Public health check endpoint.

        Returns:
            Dict with status, version, and current environment.
        """
        return {
            "status": "ok",
            "version": "1.0.0",
            "environment": settings.environment,
        }

    return app


app = create_app()
