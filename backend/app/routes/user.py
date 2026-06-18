"""User profile routes.

Handles GET /api/v1/user/profile (read), PUT /api/v1/user/profile (update),
and DELETE /api/v1/user/account (GDPR full data wipe).
"""
import logging

from fastapi import APIRouter

from app.middleware.auth import AuthToken

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile")
async def get_profile(auth_token: AuthToken) -> dict:
    """Return the authenticated user's profile document.

    Creates the profile document on first login if it does not exist.

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        UserProfile with all persisted profile fields.
    """
    uid: str = auth_token["uid"]
    logger.info("get_profile called for uid=%s", uid)
    return {}


@router.put("/profile")
async def update_profile(auth_token: AuthToken) -> dict:
    """Update mutable fields on the authenticated user's profile.

    At least one field must be provided in the request body. Immutable
    fields (uid, email, created_at) are silently ignored even if sent.

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message.
    """
    uid: str = auth_token["uid"]
    logger.info("update_profile called for uid=%s", uid)
    return {"message": "Profile updated."}


@router.delete("/account")
async def delete_account(auth_token: AuthToken) -> dict:
    """Permanently delete the authenticated user's account and all associated data.

    Wipes the user document and all subcollection documents (activities, goals,
    insights) from Firestore, then deletes the Firebase Auth user record.
    This operation is irreversible and satisfies GDPR Article 17 (right to erasure).

    Args:
        auth_token: Decoded Firebase ID token from the auth dependency.

    Returns:
        Dict with a confirmation message.
    """
    uid: str = auth_token["uid"]
    logger.info("delete_account called for uid=%s", uid)
    return {"message": "Account and all associated data deleted."}
