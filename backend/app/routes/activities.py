"""Activity logging routes.

Handles POST, GET, DELETE for /api/v1/activities and
GET /api/v1/activities/summary.
"""

import logging
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Request

from app.limiter import limiter
from app.middleware.auth import AuthToken
from app.models.activity import (
    VALID_CATEGORIES,
    ActivitiesListResponse,
    ActivitiesSummary,
    ActivityCreate,
    ActivityResponse,
    CategoryTotals,
    PeriodBounds,
)
from app.services.carbon_calculator import (
    VALID_SUBCATEGORIES,
    calculate_carbon,
    get_unit_label,
)
from app.services.firestore_service import (
    delete_activity as fs_delete_activity,
)
from app.services.firestore_service import (
    get_activities,
    get_activities_summary,
    get_activity_by_id,
    log_activity,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/activities", tags=["activities"])


# fmt: off
@router.get("/summary", response_model=ActivitiesSummary)
@limiter.limit("60/minute")
async def get_summary(request: Request, auth_token: AuthToken, start_date: str | None = None, end_date: str | None = None) -> ActivitiesSummary:  # noqa: E501
    """Return carbon totals by category for the requested date range.

    Defaults to the last 30 days when no date parameters are supplied.
    The summary route must be declared BEFORE /{activity_id} so FastAPI
    does not interpret the literal string 'summary' as a path parameter.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        auth_token: Decoded Firebase ID token from the auth dependency.
        start_date: Optional ISO date string 'YYYY-MM-DD'. Defaults to 30 days ago.
        end_date: Optional ISO date string 'YYYY-MM-DD'. Defaults to today.

    Returns:
        ActivitiesSummary with total_carbon_kg, per-category breakdown, and period.
    """
# fmt: on
    uid: str = auth_token["uid"]
    today = date.today()

    parsed_start = _parse_date_param(start_date, today - timedelta(days=30))
    parsed_end = _parse_date_param(end_date, today)

    summary = await get_activities_summary(
        uid,
        parsed_start.isoformat(),
        parsed_end.isoformat(),
    )

    by_cat = summary["by_category"]
    return ActivitiesSummary(
        total_carbon_kg=summary["total_carbon_kg"],
        by_category=CategoryTotals(
            transport=by_cat.get("transport", 0.0),
            food=by_cat.get("food", 0.0),
            energy=by_cat.get("energy", 0.0),
            shopping=by_cat.get("shopping", 0.0),
            waste=by_cat.get("waste", 0.0),
        ),
        period=PeriodBounds(
            start=summary["period"]["start"],
            end=summary["period"]["end"],
        ),
    )


# fmt: off
@router.get("", response_model=ActivitiesListResponse)
@limiter.limit("60/minute")
async def list_activities(request: Request, auth_token: AuthToken, start_date: str | None = None, end_date: str | None = None, category: str | None = None, limit: int = 50) -> ActivitiesListResponse:  # noqa: E501
    """Return activities for the authenticated user within a date range.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        auth_token: Decoded Firebase ID token from the auth dependency.
        start_date: Optional ISO date string 'YYYY-MM-DD'. Defaults to 30 days ago.
        end_date: Optional ISO date string 'YYYY-MM-DD'. Defaults to today.
        category: Optional category filter — must be one of the 5 valid categories.
        limit: Maximum number of results (1–100, default 50).

    Returns:
        ActivitiesListResponse with the activity list and total count.
    """
# fmt: on
    uid: str = auth_token["uid"]
    today = date.today()

    parsed_start = _parse_date_param(start_date, today - timedelta(days=30))
    parsed_end = _parse_date_param(end_date, today)

    if category is not None and category not in VALID_CATEGORIES:
        valid_str = ", ".join(sorted(VALID_CATEGORIES))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {valid_str}",
        )

    clamped_limit = min(max(1, limit), 100)

    activities = await get_activities(
        uid,
        parsed_start.isoformat(),
        parsed_end.isoformat(),
        category,
        clamped_limit,
    )

    response_items = [ActivityResponse(**a) for a in activities]
    return ActivitiesListResponse(activities=response_items, total=len(response_items))


# fmt: off
@router.post("", status_code=201, response_model=ActivityResponse)
@limiter.limit("60/minute")
async def create_activity(request: Request, body: ActivityCreate, auth_token: AuthToken) -> ActivityResponse:  # noqa: E501
    """Log a new activity for the authenticated user.

    Validates the subcategory, calculates carbon_kg server-side, writes the
    activity to Firestore, and returns the created document.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        body: ActivityCreate request body (category, subcategory, amount, date, notes).
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        ActivityResponse for the newly created activity with status 201.
    """
# fmt: on
    uid: str = auth_token["uid"]

    valid_subs = VALID_SUBCATEGORIES.get(body.category, frozenset())
    if body.subcategory not in valid_subs:
        valid_str = ", ".join(sorted(valid_subs))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid subcategory '{body.subcategory}' for category '{body.category}'. "
            f"Valid subcategories: {valid_str}",
        )

    carbon_kg = calculate_carbon(body.category, body.subcategory, body.amount)
    unit = get_unit_label(body.category, body.subcategory)

    saved = await log_activity(
        uid,
        body.category,
        body.subcategory,
        body.amount,
        unit,
        carbon_kg,
        body.date.isoformat(),
        body.notes,
    )

    logger.info(
        "Activity created uid=%s category=%s carbon_kg=%.4f",
        uid,
        body.category,
        carbon_kg,
    )
    return ActivityResponse(**saved)


@router.delete("/{activity_id}", status_code=200)
@limiter.limit("60/minute")
async def delete_activity(request: Request, activity_id: str, auth_token: AuthToken) -> dict:
    """Delete an activity owned by the authenticated user.

    Returns 404 if the activity does not exist or belongs to a different user.
    Never returns 403 — ownership violations are indistinguishable from absence.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        activity_id: Firestore document ID of the activity to delete.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message on success.
    """
    uid: str = auth_token["uid"]

    doc = await get_activity_by_id(activity_id)
    if doc is None or doc.get("user_id") != uid:
        raise HTTPException(status_code=404, detail="Not found.")

    await fs_delete_activity(uid, activity_id)
    logger.info("Activity deleted uid=%s activity_id=%s", uid, activity_id)
    return {"message": "Activity deleted."}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _parse_date_param(value: str | None, default: date) -> date:
    """Parse an optional ISO date query parameter, returning a default on None.

    Args:
        value: Optional ISO date string 'YYYY-MM-DD', or None.
        default: Date to return when value is None.

    Returns:
        Parsed date object.

    Raises:
        HTTPException: 400 if value is not None and cannot be parsed as a date.
    """
    if value is None:
        return default
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format '{value}'. Expected YYYY-MM-DD.",
        ) from exc
