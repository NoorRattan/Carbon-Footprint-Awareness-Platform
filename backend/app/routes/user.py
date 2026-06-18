"""User profile routes.

Handles GET /api/v1/user/profile (read), PUT /api/v1/user/profile (update),
and DELETE /api/v1/user/account (GDPR full data wipe).
"""

import logging

from fastapi import APIRouter, HTTPException, Request

from app.limiter import limiter
from app.middleware.auth import AuthToken
from app.models.user import UserProfile, UserProfileUpdate
from app.services.auth_service import create_or_update_user_on_login
from app.services.firestore_service import delete_user_data, get_user, update_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile", response_model=UserProfile)
@limiter.limit("60/minute")
async def get_profile(
    request: Request,
    auth_token: AuthToken,
) -> UserProfile:
    """Return the authenticated user's profile document.

    If the user document does not exist in Firestore (first login), it is
    created from the token claims and then fetched. This handles first-time
    login without a separate registration endpoint.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        UserProfile with all persisted profile fields.
    """
    uid: str = auth_token["uid"]

    user_data = await get_user(uid)
    if user_data is None:
        await create_or_update_user_on_login(uid, auth_token)
        user_data = await get_user(uid)

    if user_data is None:
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

    logger.info("get_profile uid=%s", uid)
    return UserProfile(**user_data)


@router.put("/profile")
@limiter.limit("60/minute")
async def update_profile(
    request: Request,
    body: UserProfileUpdate,
    auth_token: AuthToken,
) -> dict:
    """Update mutable fields on the authenticated user's profile.

    At least one field must be provided in the request body. Immutable
    fields (uid, email, created_at) are silently ignored even if sent.
    Pydantic validates region, diet_type, and household_size values
    automatically and returns 422 on invalid inputs.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        body: UserProfileUpdate request body with optional mutable profile fields.
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message on success.
    """
    uid: str = auth_token["uid"]

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields provided.")

    await update_user(uid, updates)
    logger.info("Profile updated uid=%s fields=%s", uid, list(updates.keys()))
    return {"message": "Profile updated."}


@router.delete("/account")
@limiter.limit("60/minute")
async def delete_account(
    request: Request,
    auth_token: AuthToken,
) -> dict:
    """Permanently delete the authenticated user's account and all associated data.

    Wipes all activity, goal, insight, and user documents from Firestore in
    dependency order. This satisfies GDPR Article 17 (right to erasure).
    The client must separately call Firebase Auth deleteUser() to remove the
    authentication record — this endpoint only handles Firestore data.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message on success.
    """
    uid: str = auth_token["uid"]
    logger.info("Account deletion requested for uid: %s", uid)
    await delete_user_data(uid)
    return {"message": "Account and all data deleted."}
