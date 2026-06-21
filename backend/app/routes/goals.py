"""Goals routes.

Handles CRUD for /api/v1/goals — create, list, update, and delete
carbon reduction goals for the authenticated user.
"""

import logging
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Request

from app.limiter import limiter
from app.middleware.auth import AuthToken
from app.models.goal import GoalCreate, GoalResponse, GoalUpdate
from app.services.firestore_service import (
    create_goal as fs_create_goal,
)
from app.services.firestore_service import (
    delete_goal as fs_delete_goal,
)
from app.services.firestore_service import (
    get_activities_summary,
    get_goals,
)
from app.services.firestore_service import (
    update_goal as fs_update_goal,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/goals", tags=["goals"])

Req = Request
Token = AuthToken


@router.get("", response_model=dict)
@limiter.limit("60/minute")
async def list_goals(request: Request, auth_token: AuthToken, status: str | None = None) -> dict:
    """Return all goals for the authenticated user, optionally filtered by status.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        auth_token: Decoded Firebase ID token from the auth dependency.
        status: Optional filter — 'active', 'completed', or 'failed'.

    Returns:
        Dict with a 'goals' key containing a list of GoalResponse objects.
    """
    uid: str = auth_token["uid"]

    if status is not None and status not in {"active", "completed", "failed"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Must be one of: active, completed, failed.",
        )

    goals_data = await get_goals(uid, status)
    goals = [GoalResponse(**g) for g in goals_data]
    return {"goals": [g.model_dump() for g in goals]}


@router.post("", status_code=201, response_model=GoalResponse)
@limiter.limit("60/minute")
async def create_goal(request: Request, body: GoalCreate, auth_token: AuthToken) -> GoalResponse:
    """Create a new carbon reduction goal for the authenticated user.

    Calculates baseline_carbon_kg from the last 30 days of activity for the
    requested category, then derives target_carbon_kg from the reduction
    percentage. End date is validated by the GoalCreate model (must be >= 7
    days from today).

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        body: GoalCreate request body with title, category, reduction percent, end_date.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        GoalResponse for the newly created goal with status 201.
    """
    uid: str = auth_token["uid"]
    today = date.today()
    start_30 = (today - timedelta(days=30)).isoformat()
    today_str = today.isoformat()

    summary = await get_activities_summary(uid, start_30, today_str)

    if body.category == "total":
        baseline_carbon_kg = float(summary["total_carbon_kg"])
    else:
        baseline_carbon_kg = float(summary["by_category"].get(body.category, 0.0))

    target_carbon_kg = round(baseline_carbon_kg * (1 - body.target_reduction_percent / 100), 2)

    saved = await fs_create_goal(
        uid=uid,
        title=body.title,
        category=body.category,
        target_reduction_percent=body.target_reduction_percent,
        baseline_carbon_kg=baseline_carbon_kg,
        target_carbon_kg=target_carbon_kg,
        start_date=today_str,
        end_date=body.end_date.isoformat(),
    )

    logger.info("Goal created uid=%s category=%s", uid, body.category)
    return GoalResponse(**saved)


@router.put("/{goal_id}")
@limiter.limit("60/minute")
async def update_goal(request: Req, goal_id: str, body: GoalUpdate, token: Token) -> dict:
    """Update an existing goal owned by the authenticated user.

    Returns 404 if the goal does not exist or belongs to a different user.
    Never returns 403 — ownership violations are indistinguishable from absence.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        goal_id: Firestore document ID of the goal to update.
        body: GoalUpdate request body with optional title, end_date, status.
        token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message on success.
    """
    uid: str = token["uid"]

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields provided.")

    # Serialise date fields to ISO strings before forwarding to service
    if "end_date" in updates and isinstance(updates["end_date"], date):
        updates["end_date"] = updates["end_date"].isoformat()

    original = await fs_update_goal(uid, goal_id, updates)
    if original is None or original.get("user_id") != uid:
        raise HTTPException(status_code=404, detail="Not found.")

    logger.info("Goal updated uid=%s goal_id=%s", uid, goal_id)
    return {"message": "Goal updated."}


@router.delete("/{goal_id}")
@limiter.limit("60/minute")
async def delete_goal(request: Request, goal_id: str, auth_token: AuthToken) -> dict:
    """Delete a goal owned by the authenticated user.

    Returns 404 if the goal does not exist or belongs to a different user.
    Never returns 403 — ownership violations are indistinguishable from absence.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        goal_id: Firestore document ID of the goal to delete.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message on success.
    """
    uid: str = auth_token["uid"]

    goal = await fs_delete_goal(uid, goal_id)
    if goal is None or goal.get("user_id") != uid:
        raise HTTPException(status_code=404, detail="Not found.")

    logger.info("Goal deleted uid=%s goal_id=%s", uid, goal_id)
    return {"message": "Goal deleted."}
