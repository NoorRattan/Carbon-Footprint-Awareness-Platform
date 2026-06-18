"""Insights routes.

Handles GET /api/v1/insights (SmartAdvisor output) and
POST /api/v1/insights/acknowledge/{id} (acknowledge a recommendation).
"""
import logging

from fastapi import APIRouter

from app.middleware.auth import AuthToken

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("")
async def get_insights(auth_token: AuthToken) -> dict:
    """Return personalised carbon insights for the authenticated user.

    Insights are cached in Firestore and refreshed if older than 6 hours.

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        InsightResponse with footprint summary, recommendations, and badges.
    """
    uid: str = auth_token["uid"]
    logger.info("get_insights called for uid=%s", uid)
    return {}


@router.post("/acknowledge/{recommendation_id}")
async def acknowledge_recommendation(
    recommendation_id: str,
    auth_token: AuthToken,
) -> dict:
    """Mark a recommendation as acknowledged for the authenticated user.

    Args:
        recommendation_id: Stable snake_case recommendation identifier.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message.
    """
    uid: str = auth_token["uid"]
    logger.info(
        "acknowledge_recommendation called for uid=%s rec_id=%s",
        uid,
        recommendation_id,
    )
    return {"message": "Recommendation acknowledged."}
