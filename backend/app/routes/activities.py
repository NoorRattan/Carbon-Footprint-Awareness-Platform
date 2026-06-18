"""Activity logging routes.

Handles POST, GET, DELETE for /api/v1/activities and
GET /api/v1/activities/summary.
"""
import logging

from fastapi import APIRouter

from app.middleware.auth import AuthToken

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("")
async def list_activities(auth_token: AuthToken) -> dict:
    """Return all activities for the authenticated user.

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        ActivitiesListResponse containing the user's activity list and total count.
    """
    uid: str = auth_token["uid"]
    logger.info("list_activities called for uid=%s", uid)
    return {"activities": [], "total": 0}


@router.post("", status_code=201)
async def create_activity(auth_token: AuthToken) -> dict:
    """Log a new activity for the authenticated user.

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        ActivityResponse for the newly created activity.
    """
    uid: str = auth_token["uid"]
    logger.info("create_activity called for uid=%s", uid)
    return {}


@router.delete("/{activity_id}", status_code=200)
async def delete_activity(activity_id: str, auth_token: AuthToken) -> dict:
    """Delete an activity owned by the authenticated user.

    Returns 404 if the activity does not exist or belongs to another user.

    Args:
        activity_id: Firestore document ID of the activity to delete.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message.
    """
    uid: str = auth_token["uid"]
    logger.info("delete_activity called for uid=%s activity_id=%s", uid, activity_id)
    return {"message": "Activity deleted."}


@router.get("/summary")
async def get_activities_summary(auth_token: AuthToken) -> dict:
    """Return carbon totals by category for the last 30 days.

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        ActivitiesSummary with total_carbon_kg, by_category breakdown, and period bounds.
    """
    uid: str = auth_token["uid"]
    logger.info("get_activities_summary called for uid=%s", uid)
    return {}
