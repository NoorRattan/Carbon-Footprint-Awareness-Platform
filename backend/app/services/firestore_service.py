"""Firestore data access layer for EcoTrack.

ALL Firestore operations are defined here. No other module imports
google.cloud.firestore directly. This single-responsibility design means
the camelCase (Firestore) ↔ snake_case (Python) field mapping lives
in exactly one place and can be audited or changed without touching routes
or models.

The AsyncClient is a module-level singleton created on first use.
Cloud Run containers handle many concurrent requests — creating a new
client per request would exhaust connections.
"""

import logging
from datetime import UTC, date, datetime, timedelta
from typing import Any

import google.cloud.firestore
from google.cloud.firestore_v1 import AsyncDocumentReference

logger = logging.getLogger(__name__)

# Singleton Firestore client — created once on first call to get_db()
_db: google.cloud.firestore.AsyncClient | None = None


def get_db() -> google.cloud.firestore.AsyncClient:
    """Return the Firestore AsyncClient singleton, creating it if needed.

    Returns:
        A google.cloud.firestore.AsyncClient instance. The client is
        created exactly once per process lifetime.
    """
    global _db
    if _db is None:
        _db = google.cloud.firestore.AsyncClient()
    return _db


# ---------------------------------------------------------------------------
# Private field-mapping helpers
# ---------------------------------------------------------------------------


def _user_to_firestore(data: dict[str, Any]) -> dict[str, Any]:
    """Map snake_case user dict keys to camelCase for Firestore writes.

    Args:
        data: Dictionary with snake_case field names.

    Returns:
        Dictionary with camelCase field names ready for Firestore.
    """
    mapping: dict[str, str] = {
        "display_name": "displayName",
        "diet_type": "dietType",
        "household_size": "householdSize",
        "last_seen": "lastSeen",
        "total_carbon_kg": "totalCarbonKg",
        "monthly_totals": "monthlyTotals",
        "last_log_date": "lastLogDate",
        "created_at": "createdAt",
    }
    return {mapping.get(k, k): v for k, v in data.items()}


def _user_from_firestore(doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Map camelCase Firestore user document to snake_case Python dict.

    Args:
        doc_id: Firestore document ID (Firebase Auth UID).
        data: Raw Firestore document data with camelCase keys.

    Returns:
        Dictionary with snake_case field names and a top-level 'uid' key.
    """
    now = datetime.now(UTC).isoformat()
    return {
        "uid": doc_id,
        "email": data.get("email", ""),
        "display_name": data.get("displayName", ""),
        "region": data.get("region", "OTHER"),
        "diet_type": data.get("dietType", "average"),
        "household_size": data.get("householdSize", 1),
        "created_at": _ts_to_str(data.get("createdAt", now)),
        "streak": data.get("streak", 0),
        "badges": data.get("badges", []),
        "total_carbon_kg": data.get("totalCarbonKg", 0.0),
        "monthly_totals": data.get("monthlyTotals", {}),
        "last_log_date": data.get("lastLogDate"),
        "last_seen": _ts_to_str(data.get("lastSeen", now)),
    }


def _activity_to_firestore(uid: str, data: dict[str, Any]) -> dict[str, Any]:
    """Map snake_case activity dict keys to camelCase for Firestore writes.

    Args:
        uid: Firebase Auth UID to store as userId.
        data: Dictionary with snake_case field names.

    Returns:
        Dictionary with camelCase field names ready for Firestore.
    """
    return {
        "userId": uid,
        "category": data["category"],
        "subcategory": data["subcategory"],
        "amount": data["amount"],
        "unit": data["unit"],
        "carbonKg": data["carbon_kg"],
        "date": data["date"],
        "notes": data.get("notes"),
        "createdAt": data.get("created_at", datetime.now(UTC).isoformat()),
    }


def _activity_from_firestore(doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Map camelCase Firestore activity document to snake_case Python dict.

    Args:
        doc_id: Firestore document ID.
        data: Raw Firestore document data with camelCase keys.

    Returns:
        Dictionary with snake_case field names and an 'id' key.
    """
    return {
        "id": doc_id,
        "user_id": data.get("userId", ""),
        "category": data.get("category", ""),
        "subcategory": data.get("subcategory", ""),
        "amount": data.get("amount", 0.0),
        "unit": data.get("unit", ""),
        "carbon_kg": data.get("carbonKg", 0.0),
        "date": data.get("date", ""),
        "notes": data.get("notes"),
        "created_at": _ts_to_str(data.get("createdAt", "")),
    }


def _goal_to_firestore(uid: str, data: dict[str, Any]) -> dict[str, Any]:
    """Map snake_case goal dict keys to camelCase for Firestore writes.

    Args:
        uid: Firebase Auth UID to store as userId.
        data: Dictionary with snake_case field names.

    Returns:
        Dictionary with camelCase field names ready for Firestore.
    """
    return {
        "userId": uid,
        "title": data["title"],
        "category": data["category"],
        "targetReductionPercent": data["target_reduction_percent"],
        "baselineCarbonKg": data["baseline_carbon_kg"],
        "targetCarbonKg": data["target_carbon_kg"],
        "startDate": data["start_date"],
        "endDate": data["end_date"],
        "status": data.get("status", "active"),
        "createdAt": data.get("created_at", datetime.now(UTC).isoformat()),
    }


def _goal_from_firestore(doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Map camelCase Firestore goal document to snake_case Python dict.

    Args:
        doc_id: Firestore document ID.
        data: Raw Firestore document data with camelCase keys.

    Returns:
        Dictionary with snake_case field names and an 'id' key.
    """
    return {
        "id": doc_id,
        "user_id": data.get("userId", ""),
        "title": data.get("title", ""),
        "category": data.get("category", ""),
        "target_reduction_percent": data.get("targetReductionPercent", 0.0),
        "baseline_carbon_kg": data.get("baselineCarbonKg", 0.0),
        "target_carbon_kg": data.get("targetCarbonKg", 0.0),
        "start_date": data.get("startDate", ""),
        "end_date": data.get("endDate", ""),
        "status": data.get("status", "active"),
        "created_at": _ts_to_str(data.get("createdAt", "")),
    }


def _insight_to_firestore(uid: str, data: dict[str, Any]) -> dict[str, Any]:
    """Map snake_case insight dict keys to camelCase for Firestore writes.

    Args:
        uid: Firebase Auth UID to store as userId.
        data: Dictionary with snake_case field names matching InsightResponse shape.

    Returns:
        Dictionary with camelCase field names ready for Firestore.
    """
    recommendations = []
    for rec in data.get("recommendations", []):
        recommendations.append(
            {
                "id": rec.get("id", ""),
                "title": rec.get("title", ""),
                "description": rec.get("description", ""),
                "category": rec.get("category", ""),
                "estimatedSavingKg": rec.get("estimated_saving_kg", 0.0),
                "difficulty": rec.get("difficulty", "medium"),
            }
        )
    return {
        "userId": uid,
        "generatedAt": data.get("generated_at", datetime.now(UTC).isoformat()),
        "footprintKg": data.get("footprint_kg", 0.0),
        "vsAveragePercent": data.get("vs_average_percent", 0.0),
        "topCategory": data.get("top_category"),
        "monthlyChangePercent": data.get("monthly_change_percent", 0.0),
        "recommendations": recommendations,
        "achievements": data.get("achievements", []),
    }


def _insight_from_firestore(data: dict[str, Any]) -> dict[str, Any]:
    """Map camelCase Firestore insight document to snake_case Python dict.

    Args:
        data: Raw Firestore document data with camelCase keys.

    Returns:
        Dictionary with snake_case field names matching InsightResponse shape.
    """
    recommendations = []
    for rec in data.get("recommendations", []):
        recommendations.append(
            {
                "id": rec.get("id", ""),
                "title": rec.get("title", ""),
                "description": rec.get("description", ""),
                "category": rec.get("category", ""),
                "estimated_saving_kg": rec.get("estimatedSavingKg", 0.0),
                "difficulty": rec.get("difficulty", "medium"),
            }
        )
    return {
        "footprint_kg": data.get("footprintKg", 0.0),
        "vs_average_percent": data.get("vsAveragePercent", 0.0),
        "top_category": data.get("topCategory"),
        "monthly_change_percent": data.get("monthlyChangePercent", 0.0),
        "recommendations": recommendations,
        "achievements": data.get("achievements", []),
        "generated_at": _ts_to_str(data.get("generatedAt", "")),
    }


def _education_from_firestore(doc_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Map camelCase Firestore education document to snake_case Python dict.

    Args:
        doc_id: Firestore document ID (also the slug).
        data: Raw Firestore document data with camelCase keys.

    Returns:
        Dictionary with snake_case field names matching EducationSummary/Detail shape.
    """
    return {
        "slug": doc_id,
        "title": data.get("title", ""),
        "category": data.get("category", "general"),
        "read_time": data.get("readTime", 1),
        "updated_at": _ts_to_str(data.get("updatedAt", "")),
        "content": data.get("content", ""),
    }


def _ts_to_str(value: Any) -> str:
    """Convert a Firestore Timestamp or string to an ISO 8601 string.

    Args:
        value: A google.cloud.firestore Timestamp, datetime, or str.

    Returns:
        ISO 8601 datetime string. Returns the input unchanged if already a str.
    """
    if isinstance(value, str):
        return value
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


# ---------------------------------------------------------------------------
# Private streak helper
# ---------------------------------------------------------------------------


async def _update_streak(uid: str, activity_date_str: str) -> None:
    """Update the user's consecutive logging streak after a new activity.

    Streak increments if the user logged yesterday. Resets to 1 if they
    missed a day. No change if they already logged today.

    Args:
        uid: Firebase Auth UID.
        activity_date_str: ISO date string 'YYYY-MM-DD' of the activity being logged.

    Returns:
        None.
    """
    db = get_db()
    user_ref: AsyncDocumentReference = db.collection("users").document(uid)
    snapshot = await user_ref.get()
    if not snapshot.exists:
        return

    data = snapshot.to_dict() or {}
    last_log_date_str: str | None = data.get("lastLogDate")
    current_streak: int = int(data.get("streak", 0))
    today = date.today()

    if last_log_date_str:
        try:
            last_log = date.fromisoformat(last_log_date_str)
        except ValueError:
            last_log = None
    else:
        last_log = None

    if last_log == today:
        # Already logged today — streak unchanged
        return
    elif last_log == today - timedelta(days=1):
        new_streak = current_streak + 1
    else:
        new_streak = 1

    await user_ref.update(
        {
            "streak": new_streak,
            "lastLogDate": today.isoformat(),
        }
    )
    logger.debug("Streak updated for uid=%s: %d → %d", uid, current_streak, new_streak)


# ---------------------------------------------------------------------------
# Private monthly totals helper
# ---------------------------------------------------------------------------


async def _update_monthly_totals(uid: str, year_month: str, delta_kg: float) -> None:
    """Atomically update the user's monthly CO₂e total for a given month.

    Args:
        uid: Firebase Auth UID.
        year_month: Month key in format 'YYYY-MM' (e.g., '2026-05').
        delta_kg: CO₂e delta to apply — positive when logging, negative when deleting.

    Returns:
        None.
    """
    db = get_db()
    user_ref: AsyncDocumentReference = db.collection("users").document(uid)
    snapshot = await user_ref.get()
    if not snapshot.exists:
        return

    data = snapshot.to_dict() or {}
    monthly_totals: dict[str, float] = dict(data.get("monthlyTotals", {}))
    current = float(monthly_totals.get(year_month, 0.0))
    monthly_totals[year_month] = max(0.0, round(current + delta_kg, 4))

    total_carbon_kg = float(data.get("totalCarbonKg", 0.0))
    new_total = max(0.0, round(total_carbon_kg + delta_kg, 4))

    await user_ref.update(
        {
            "monthlyTotals": monthly_totals,
            "totalCarbonKg": new_total,
        }
    )
    logger.debug("Monthly totals updated for uid=%s month=%s delta=%.4f", uid, year_month, delta_kg)


# ---------------------------------------------------------------------------
# User functions
# ---------------------------------------------------------------------------


async def get_user(uid: str) -> dict[str, Any] | None:
    """Retrieve a user document from Firestore by UID.

    Args:
        uid: Firebase Auth UID (Firestore document ID in the 'users' collection).

    Returns:
        A snake_case dict of the user's profile fields, or None if the
        document does not exist.
    """
    db = get_db()
    snapshot = await db.collection("users").document(uid).get()
    if not snapshot.exists:
        return None
    return _user_from_firestore(snapshot.id, snapshot.to_dict() or {})


async def upsert_user(uid: str, **kwargs: Any) -> None:
    """Create or update a user document using merge semantics.

    Merge=True means only the provided fields are written; existing fields
    not included in kwargs are left unchanged. This is used for both first
    login (creates the document) and subsequent logins (updates lastSeen).

    On first creation, also sets: region='OTHER', dietType='average',
    householdSize=1, streak=0, badges=[], totalCarbonKg=0.0,
    monthlyTotals={}, createdAt=now (only if not already present).

    Args:
        uid: Firebase Auth UID.
        **kwargs: snake_case field names and values to write.
                  Automatically mapped to camelCase before writing.

    Returns:
        None.
    """
    db = get_db()
    user_ref: AsyncDocumentReference = db.collection("users").document(uid)
    snapshot = await user_ref.get()

    now = datetime.now(UTC).isoformat()

    # Build the base document for first-login creation
    if not snapshot.exists:
        base: dict[str, Any] = {
            "region": "OTHER",
            "dietType": "average",
            "householdSize": 1,
            "streak": 0,
            "badges": [],
            "totalCarbonKg": 0.0,
            "monthlyTotals": {},
            "createdAt": now,
        }
    else:
        base = {}

    # Map caller kwargs to camelCase
    fs_data = _user_to_firestore(dict(kwargs))
    merged = {**base, **fs_data}

    await user_ref.set(merged, merge=True)
    logger.debug("User upserted uid=%s fields=%s", uid, list(merged.keys()))


async def update_user(uid: str, updates: dict[str, Any]) -> None:
    """Update specific fields on an existing user document.

    Unlike upsert_user, this function does NOT set default fields on missing
    documents. Use upsert_user for first-login creation.

    Args:
        uid: Firebase Auth UID.
        updates: snake_case field names and values to update.
                 Automatically mapped to camelCase before writing.

    Returns:
        None.

    Raises:
        google.cloud.exceptions.NotFound: If the user document does not exist.
    """
    db = get_db()
    fs_updates = _user_to_firestore(updates)
    await db.collection("users").document(uid).update(fs_updates)
    logger.debug("User updated uid=%s fields=%s", uid, list(fs_updates.keys()))


async def delete_user_data(uid: str) -> None:
    """Delete all Firestore data for a user (GDPR erasure).

    Deletion order is important:
    1. Delete all documents in 'activities' where userId == uid
    2. Delete all documents in 'goals' where userId == uid
    3. Delete the 'insights/{uid}' document
    4. Delete the 'users/{uid}' document

    Subcollections must be deleted BEFORE the parent document.

    Args:
        uid: Firebase Auth UID of the user to erase.

    Returns:
        None. Logs the number of documents deleted in each collection.
    """
    db = get_db()

    # 1. Delete activities
    act_count = 0
    async for snap in db.collection("activities").where("userId", "==", uid).stream():
        await snap.reference.delete()
        act_count += 1
    logger.info("GDPR: deleted %d activities for uid=%s", act_count, uid)

    # 2. Delete goals
    goal_count = 0
    async for snap in db.collection("goals").where("userId", "==", uid).stream():
        await snap.reference.delete()
        goal_count += 1
    logger.info("GDPR: deleted %d goals for uid=%s", goal_count, uid)

    # 3. Delete insights document
    await db.collection("insights").document(uid).delete()
    logger.info("GDPR: deleted insights document for uid=%s", uid)

    # 4. Delete user document
    await db.collection("users").document(uid).delete()
    logger.info("GDPR: deleted user document for uid=%s", uid)


# ---------------------------------------------------------------------------
# Activity functions
# ---------------------------------------------------------------------------


async def log_activity(
    uid: str,
    category: str,
    subcategory: str,
    amount: float,
    unit: str,
    carbon_kg: float,
    date_str: str,
    notes: str | None,
) -> dict[str, Any]:
    """Write a new activity document to Firestore.

    Stores all fields in camelCase. The document ID is auto-generated
    by Firestore. After writing, updates the user's totalCarbonKg and
    monthlyTotals map, and recalculates streak.

    Args:
        uid: Firebase Auth UID — stored as userId.
        category: Activity category string.
        subcategory: Activity subcategory string.
        amount: Quantity logged.
        unit: Unit label string.
        carbon_kg: Pre-calculated CO₂e in kg — stored as carbonKg.
        date_str: ISO date string 'YYYY-MM-DD' — the activity date.
        notes: Optional user note.

    Returns:
        A snake_case dict of the written document including the generated id.
    """
    db = get_db()
    now = datetime.now(UTC).isoformat()
    doc_data: dict[str, Any] = {
        "category": category,
        "subcategory": subcategory,
        "amount": amount,
        "unit": unit,
        "carbon_kg": carbon_kg,
        "date": date_str,
        "notes": notes,
        "created_at": now,
    }
    fs_doc = _activity_to_firestore(uid, doc_data)

    _, doc_ref = await db.collection("activities").add(fs_doc)
    logger.info("Activity logged doc_id=%s uid=%s category=%s", doc_ref.id, uid, category)

    # Update monthly totals and streak
    year_month = date_str[:7]  # "YYYY-MM"
    await _update_monthly_totals(uid, year_month, carbon_kg)
    await _update_streak(uid, date_str)

    return _activity_from_firestore(doc_ref.id, fs_doc)


async def get_activities(
    uid: str,
    start_date: str,
    end_date: str,
    category: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """Retrieve activities for a user within a date range.

    Results are ordered by date DESC (newest first). All Firestore camelCase
    fields are mapped to snake_case in the returned dicts.

    Args:
        uid: Firebase Auth UID.
        start_date: ISO date string 'YYYY-MM-DD' — inclusive lower bound.
        end_date: ISO date string 'YYYY-MM-DD' — inclusive upper bound.
        category: Optional category filter. If None, all categories returned.
        limit: Maximum number of results (1–100, default 50).

    Returns:
        List of snake_case activity dicts, newest first. Each dict includes
        an 'id' field with the Firestore document ID.
    """
    db = get_db()
    query = (
        db.collection("activities")
        .where("userId", "==", uid)
        .where("date", ">=", start_date)
        .where("date", "<=", end_date)
        .order_by("date", direction=google.cloud.firestore.Query.DESCENDING)
        .limit(limit)
    )
    if category:
        query = query.where("category", "==", category)

    results: list[dict[str, Any]] = []
    async for snap in query.stream():
        results.append(_activity_from_firestore(snap.id, snap.to_dict() or {}))
    return results


async def delete_activity(uid: str, activity_id: str) -> dict[str, Any] | None:
    """Delete a single activity document by ID.

    Retrieves the document first to verify it exists. The ownership check
    (userId == uid) is performed in the route handler, not here — this
    function returns the raw document so the route can check ownership.

    After deletion, updates the user's totalCarbonKg (subtracts carbon_kg)
    and the relevant month in monthlyTotals.

    Args:
        uid: Firebase Auth UID (used for post-delete accounting only).
        activity_id: Firestore document ID of the activity.

    Returns:
        The snake_case dict of the deleted document (so the route can check
        ownership before the deletion actually happens), or None if not found.
    """
    db = get_db()
    doc_ref = db.collection("activities").document(activity_id)
    snapshot = await doc_ref.get()
    if not snapshot.exists:
        return None

    data = snapshot.to_dict() or {}
    activity = _activity_from_firestore(snapshot.id, data)

    await doc_ref.delete()
    logger.info("Activity deleted doc_id=%s", activity_id)

    # Reverse the monthly totals and total carbon
    date_str: str = activity.get("date", "")
    carbon_kg: float = float(activity.get("carbon_kg", 0.0))
    if date_str and carbon_kg:
        year_month = date_str[:7]
        await _update_monthly_totals(uid, year_month, -carbon_kg)

    return activity


async def get_activity_by_id(activity_id: str) -> dict[str, Any] | None:
    """Retrieve a single activity document by Firestore document ID.

    Used by the DELETE route to verify existence and ownership before
    performing the delete. The caller is responsible for checking that
    the returned document's 'user_id' matches the authenticated user.

    Args:
        activity_id: Firestore document ID in the 'activities' collection.

    Returns:
        A snake_case activity dict (including 'user_id') if the document
        exists, or None if not found.
    """
    db = get_db()
    snapshot = await db.collection("activities").document(activity_id).get()
    if not snapshot.exists:
        return None
    return _activity_from_firestore(snapshot.id, snapshot.to_dict() or {})


async def get_activities_summary(
    uid: str,
    start_date: str,
    end_date: str,
) -> dict[str, Any]:
    """Calculate aggregated carbon totals by category for a date range.

    Retrieves all activities in the date range (no limit applied here —
    aggregation needs the complete set) and sums carbon_kg by category.

    Args:
        uid: Firebase Auth UID.
        start_date: ISO date string 'YYYY-MM-DD' — inclusive lower bound.
        end_date: ISO date string 'YYYY-MM-DD' — inclusive upper bound.

    Returns:
        A dict with keys: total_carbon_kg (float), by_category (dict mapping
        each of the 5 categories to its carbon_kg sum), and period
        (dict with start and end ISO strings).
    """
    db = get_db()
    query = (
        db.collection("activities")
        .where("userId", "==", uid)
        .where("date", ">=", start_date)
        .where("date", "<=", end_date)
    )
    categories = ["transport", "food", "energy", "shopping", "waste"]
    by_category: dict[str, float] = {c: 0.0 for c in categories}
    total_kg = 0.0

    async for snap in query.stream():
        data = snap.to_dict() or {}
        cat = data.get("category", "")
        kg = float(data.get("carbonKg", 0.0))
        total_kg = round(total_kg + kg, 4)
        if cat in by_category:
            by_category[cat] = round(by_category[cat] + kg, 4)

    return {
        "total_carbon_kg": round(total_kg, 4),
        "by_category": by_category,
        "period": {"start": start_date, "end": end_date},
    }


# ---------------------------------------------------------------------------
# Goal functions
# ---------------------------------------------------------------------------


async def create_goal(
    uid: str,
    title: str,
    category: str,
    target_reduction_percent: float,
    baseline_carbon_kg: float,
    target_carbon_kg: float,
    start_date: str,
    end_date: str,
) -> dict[str, Any]:
    """Write a new goal document to Firestore.

    Also adds the 'goal_setter' badge to the user's badges list if not
    already present (this is the badge for creating a first goal).

    Args:
        uid: Firebase Auth UID — stored as userId.
        title: User-written goal title.
        category: Goal category string or 'total'.
        target_reduction_percent: Target percentage reduction (1–100).
        baseline_carbon_kg: User's recent carbon for this category.
        target_carbon_kg: Calculated target (baseline * (1 - pct/100)).
        start_date: ISO date string — goal start date.
        end_date: ISO date string — goal deadline.

    Returns:
        A snake_case dict of the written document including the generated id.
    """
    db = get_db()
    now = datetime.now(UTC).isoformat()
    doc_data: dict[str, Any] = {
        "title": title,
        "category": category,
        "target_reduction_percent": target_reduction_percent,
        "baseline_carbon_kg": baseline_carbon_kg,
        "target_carbon_kg": target_carbon_kg,
        "start_date": start_date,
        "end_date": end_date,
        "status": "active",
        "created_at": now,
    }
    fs_doc = _goal_to_firestore(uid, doc_data)
    _, doc_ref = await db.collection("goals").add(fs_doc)
    logger.info("Goal created doc_id=%s uid=%s category=%s", doc_ref.id, uid, category)

    # Award 'goal_setter' badge on first goal
    user_snap = await db.collection("users").document(uid).get()
    if user_snap.exists:
        user_data = user_snap.to_dict() or {}
        badges: list[str] = list(user_data.get("badges", []))
        if "goal_setter" not in badges:
            badges.append("goal_setter")
            await db.collection("users").document(uid).update({"badges": badges})
            logger.info("Badge 'goal_setter' awarded to uid=%s", uid)

    return _goal_from_firestore(doc_ref.id, fs_doc)


async def get_goals(uid: str, status: str | None = None) -> list[dict[str, Any]]:
    """Retrieve goals for a user, optionally filtered by status.

    Args:
        uid: Firebase Auth UID.
        status: Optional status filter — 'active', 'completed', or 'failed'.
                If None, all goals are returned.

    Returns:
        List of snake_case goal dicts, newest first.
    """
    db = get_db()
    query = db.collection("goals").where("userId", "==", uid)
    if status:
        query = query.where("status", "==", status)

    results: list[dict[str, Any]] = []
    async for snap in query.stream():
        results.append(_goal_from_firestore(snap.id, snap.to_dict() or {}))

    # Sort newest first by created_at
    results.sort(key=lambda g: g.get("created_at", ""), reverse=True)
    return results


async def update_goal(uid: str, goal_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    """Update specific fields on an existing goal document.

    Only writes the fields present in `updates`. Performs no ownership check
    here — the route handler checks that userId == uid before calling this.

    Args:
        uid: Firebase Auth UID.
        goal_id: Firestore document ID.
        updates: snake_case field names and values to update.

    Returns:
        The snake_case dict of the document before update, or None if not found.
    """
    db = get_db()
    doc_ref = db.collection("goals").document(goal_id)
    snapshot = await doc_ref.get()
    if not snapshot.exists:
        return None

    original = _goal_from_firestore(snapshot.id, snapshot.to_dict() or {})

    # Map snake_case updates to camelCase
    mapping: dict[str, str] = {
        "title": "title",
        "end_date": "endDate",
        "status": "status",
        "target_reduction_percent": "targetReductionPercent",
    }
    fs_updates: dict[str, Any] = {}
    for snake, value in updates.items():
        camel = mapping.get(snake, snake)
        fs_updates[camel] = value

    await doc_ref.update(fs_updates)
    logger.info("Goal updated doc_id=%s uid=%s", goal_id, uid)
    return original


async def delete_goal(uid: str, goal_id: str) -> dict[str, Any] | None:
    """Delete a goal document by ID.

    Like delete_activity, returns the document before deleting so the route
    can verify ownership.

    Args:
        uid: Firebase Auth UID.
        goal_id: Firestore document ID.

    Returns:
        The snake_case dict of the document before deletion, or None if not found.
    """
    db = get_db()
    doc_ref = db.collection("goals").document(goal_id)
    snapshot = await doc_ref.get()
    if not snapshot.exists:
        return None

    goal = _goal_from_firestore(snapshot.id, snapshot.to_dict() or {})
    await doc_ref.delete()
    logger.info("Goal deleted doc_id=%s uid=%s", goal_id, uid)
    return goal


# ---------------------------------------------------------------------------
# Insight functions
# ---------------------------------------------------------------------------


async def get_insights(uid: str) -> dict[str, Any] | None:
    """Retrieve the cached insights document for a user.

    The insights collection uses the user's UID as the document ID — there
    is exactly one insights document per user, overwritten on each refresh.

    Args:
        uid: Firebase Auth UID (also the insights document ID).

    Returns:
        The snake_case insights dict (including generated_at timestamp string),
        or None if no insights have been generated yet.
    """
    db = get_db()
    snapshot = await db.collection("insights").document(uid).get()
    if not snapshot.exists:
        return None
    return _insight_from_firestore(snapshot.to_dict() or {})


async def save_insights(uid: str, insight_data: dict[str, Any]) -> None:
    """Write (overwrite) the insights document for a user.

    Uses set() with no merge — the entire document is replaced. This is
    intentional: insights are a complete snapshot of a point-in-time analysis.

    Args:
        uid: Firebase Auth UID (also the insights document ID).
        insight_data: snake_case dict matching the InsightResponse shape.
                      This function maps it to camelCase before writing.

    Returns:
        None.
    """
    db = get_db()
    fs_doc = _insight_to_firestore(uid, insight_data)
    await db.collection("insights").document(uid).set(fs_doc)
    logger.info("Insights saved for uid=%s", uid)


async def acknowledge_recommendation(uid: str, recommendation_id: str) -> None:
    """Append a recommendation ID to the user's acknowledged list in Firestore.

    Uses ArrayUnion so the operation is idempotent — adding an already-present
    ID is a no-op. Future insight generations filter out acknowledged IDs.

    Args:
        uid: Firebase Auth UID (also the insights document ID).
        recommendation_id: Stable snake_case recommendation identifier to acknowledge.

    Returns:
        None.
    """
    db = get_db()
    doc_ref = db.collection("insights").document(uid)
    await doc_ref.set(
        {"acknowledgedIds": google.cloud.firestore.ArrayUnion([recommendation_id])},
        merge=True,
    )
    logger.info("Recommendation acknowledged uid=%s rec_id=%s", uid, recommendation_id)


# ---------------------------------------------------------------------------
# Education functions
# ---------------------------------------------------------------------------


async def get_education(category: str | None = None) -> list[dict[str, Any]]:
    """Retrieve published education article summaries.

    Only returns articles where published == True. Full content is excluded —
    use get_education_by_slug for full article data.

    Args:
        category: Optional category filter. If None, all categories returned.

    Returns:
        List of snake_case EducationSummary dicts (no content field),
        sorted by updated_at DESC.
    """
    db = get_db()
    query = db.collection("education").where("published", "==", True)
    if category:
        query = query.where("category", "==", category)

    results: list[dict[str, Any]] = []
    async for snap in query.stream():
        doc = _education_from_firestore(snap.id, snap.to_dict() or {})
        # Exclude content field for the summary list
        doc.pop("content", None)
        results.append(doc)

    results.sort(key=lambda a: a.get("updated_at", ""), reverse=True)
    return results


async def get_education_by_slug(slug: str) -> dict[str, Any] | None:
    """Retrieve a single published education article by slug.

    The slug is also the Firestore document ID in the 'education' collection.

    Args:
        slug: URL-safe article identifier (e.g., 'why-transport-matters').

    Returns:
        The full snake_case article dict including the content field,
        or None if the article does not exist or published == False.
    """
    db = get_db()
    snapshot = await db.collection("education").document(slug).get()
    if not snapshot.exists:
        return None
    data = snapshot.to_dict() or {}
    if not data.get("published", False):
        return None
    return _education_from_firestore(snapshot.id, data)
