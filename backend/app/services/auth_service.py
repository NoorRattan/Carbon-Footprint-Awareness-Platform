"""Authentication service helpers for EcoTrack.

Provides functions called by route handlers after Firebase token
verification to synchronise user state with Firestore.
"""

import logging
from datetime import UTC, datetime

from app.services.firestore_service import upsert_user

logger = logging.getLogger(__name__)


async def create_or_update_user_on_login(uid: str, token_data: dict) -> None:
    """Create or update the Firestore user document on successful login.

    Called by the GET /user/profile route after token verification.
    Uses merge=True so existing fields are not overwritten on repeat logins.
    Only sets createdAt on first login; always updates lastSeen.

    Args:
        uid: Firebase Auth UID from the verified token.
        token_data: Decoded Firebase ID token dict containing at minimum
                    'email', and optionally 'name' and 'picture'.

    Returns:
        None. Errors are logged but not raised — a failed profile sync
        should not cause a 500 on login.
    """
    try:
        email: str = token_data.get("email", "")
        display_name: str = token_data.get("name", email.split("@")[0])
        now: str = datetime.now(UTC).isoformat()

        await upsert_user(
            uid=uid,
            email=email,
            display_name=display_name,
            last_seen=now,
        )
        logger.info("User synced on login: uid=%s", uid)
    except Exception as exc:
        logger.exception("Failed to sync user on login (uid=%s): %s", uid, exc)
