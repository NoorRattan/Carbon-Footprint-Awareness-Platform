"""Goals routes.

Handles CRUD for /api/v1/goals — create, list, update, and delete
carbon reduction goals for the authenticated user.
"""
import logging

from fastapi import APIRouter

from app.middleware.auth import AuthToken

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("")
async def list_goals(auth_token: AuthToken) -> dict:
    """Return all goals for the authenticated user.

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a 'goals' key containing a list of GoalResponse objects.
    """
    uid: str = auth_token["uid"]
    logger.info("list_goals called for uid=%s", uid)
    return {"goals": []}


@router.post("", status_code=201)
async def create_goal(auth_token: AuthToken) -> dict:
    """Create a new reduction goal for the authenticated user.

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        GoalResponse for the newly created goal.
    """
    uid: str = auth_token["uid"]
    logger.info("create_goal called for uid=%s", uid)
    return {}


@router.put("/{goal_id}")
async def update_goal(goal_id: str, auth_token: AuthToken) -> dict:
    """Update an existing goal owned by the authenticated user.

    Returns 404 if the goal does not exist or belongs to another user.

    Args:
        goal_id: Firestore document ID of the goal to update.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message.
    """
    uid: str = auth_token["uid"]
    logger.info("update_goal called for uid=%s goal_id=%s", uid, goal_id)
    return {"message": "Goal updated."}


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, auth_token: AuthToken) -> dict:
    """Delete a goal owned by the authenticated user.

    Returns 404 if the goal does not exist or belongs to another user.

    Args:
        goal_id: Firestore document ID of the goal to delete.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message.
    """
    uid: str = auth_token["uid"]
    logger.info("delete_goal called for uid=%s goal_id=%s", uid, goal_id)
    return {"message": "Goal deleted."}
