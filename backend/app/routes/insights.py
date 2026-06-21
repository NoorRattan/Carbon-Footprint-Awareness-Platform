"""Insights routes.

Handles GET /api/v1/insights (SmartAdvisor output) and
POST /api/v1/insights/acknowledge/{id} (acknowledge a recommendation).
"""

import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Request

from app.limiter import limiter
from app.middleware.auth import AuthToken
from app.models.insight import InsightResponse
from app.models.user import UserProfile
from app.services.firestore_service import (
    acknowledge_recommendation,
    get_activities,
    get_insights,
    get_user,
    save_insights,
)
from app.services.recommendation_engine import generate_insights

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["insights"])

_SIX_HOURS_SECONDS = 21600


@router.get("", response_model=InsightResponse)
@limiter.limit("60/minute")
async def get_user_insights(request: Request, auth_token: AuthToken) -> InsightResponse:
    """Return personalised carbon insights for the authenticated user.

    Insights are cached in Firestore and refreshed when the cache is older
    than 6 hours or no cache exists yet. If the user has no activities at
    all, the engine still runs and returns an empty recommendations list.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        InsightResponse with footprint summary, recommendations, and badges.
    """
    uid: str = auth_token["uid"]

    cached = await get_insights(uid)
    if cached is not None:
        generated_at_str: str = cached.get("generated_at", "")
        try:
            generated_at = datetime.fromisoformat(generated_at_str)
            if generated_at.tzinfo is None:
                generated_at = generated_at.replace(tzinfo=UTC)
            age_seconds = (datetime.now(UTC) - generated_at).total_seconds()
            if age_seconds < _SIX_HOURS_SECONDS:
                logger.info("Returning cached insights for uid=%s age=%.0fs", uid, age_seconds)
                return InsightResponse(**cached)
        except (ValueError, TypeError):
            logger.warning("Could not parse cached generated_at for uid=%s", uid)

    logger.info("Generating fresh insights for uid=%s", uid)

    today = datetime.now(UTC).date()
    start_30 = (today - timedelta(days=30)).isoformat()
    start_60 = (today - timedelta(days=60)).isoformat()
    today_str = today.isoformat()

    activities_current = await get_activities(uid, start_30, today_str, limit=500)
    activities_previous = await get_activities(uid, start_60, start_30, limit=500)

    user_data = await get_user(uid)
    if user_data is None:
        user_profile = UserProfile(
            uid=uid,
            email=auth_token.get("email", ""),
            display_name=auth_token.get("name", ""),
            created_at=datetime.now(UTC).isoformat(),
        )
    else:
        user_profile = UserProfile(**user_data)

    result: InsightResponse = await generate_insights(
        uid, activities_current, activities_previous, user_profile
    )

    await save_insights(uid, result.model_dump())
    return result


# fmt: off
@router.post("/acknowledge/{recommendation_id}")
@limiter.limit("60/minute")
async def acknowledge_user_recommendation(request: Request, recommendation_id: str, auth_token: AuthToken) -> dict:  # noqa: E501
    """Mark a recommendation as acknowledged for the authenticated user.

    Appends recommendation_id to the acknowledgedIds array in the user's
    Firestore insights document. The recommendation engine already filters
    out acknowledged IDs on the next insights refresh.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        recommendation_id: Stable snake_case recommendation identifier.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message.
    """
# fmt: on
    uid: str = auth_token["uid"]
    await acknowledge_recommendation(uid, recommendation_id)
    logger.info(
        "Recommendation acknowledged uid=%s rec_id=%s",
        uid,
        recommendation_id,
    )
    return {"message": "Recommendation acknowledged."}
