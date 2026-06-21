"""Firebase JWT authentication middleware for FastAPI.

Provides the require_auth dependency that verifies Firebase ID tokens
on every protected endpoint.

CRITICAL: firebase_admin.auth.verify_id_token() is SYNCHRONOUS. It MUST
be called via run_in_executor to avoid blocking the async event loop.
Calling it directly in an async function will cause intermittent hangs
under load.
"""

import asyncio
import logging
from typing import Annotated

import firebase_admin.auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

# auto_error=False so we can return 401 with a custom message instead of 403
_bearer_scheme = HTTPBearer(auto_error=False)

AuthCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)]


async def require_auth(credentials: AuthCredentials = None) -> dict:
    """Verify a Firebase ID token and return the decoded token payload.

    Extracts the Bearer token from the Authorization header, verifies it
    with Firebase Admin SDK (synchronously via run_in_executor), and
    returns the decoded token dict.

    Args:
        credentials: HTTP Bearer credentials extracted by FastAPI's HTTPBearer scheme.
                     None if the Authorization header is missing.

    Returns:
        Decoded Firebase ID token as a dict containing at minimum:
        - uid (str): Firebase user ID
        - email (str): User email address
        - name (str): Display name (if set in Firebase Auth)

    Raises:
        HTTPException: 401 Unauthorized with a descriptive message if the
                       token is missing, expired, or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing. Provide a Bearer token.",
        )

    token = credentials.credentials

    try:
        loop = asyncio.get_event_loop()
        decoded_token: dict = await loop.run_in_executor(
            None, firebase_admin.auth.verify_id_token, token
        )
        return decoded_token

    except firebase_admin.auth.ExpiredIdTokenError:
        logger.warning("Expired Firebase ID token presented.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please sign in again.",
        ) from None
    except firebase_admin.auth.InvalidIdTokenError as exc:
        logger.warning("Invalid Firebase ID token: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        ) from exc
    except firebase_admin.auth.RevokedIdTokenError:
        logger.warning("Revoked Firebase ID token presented.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please sign in again.",
        ) from None
    except Exception as exc:
        logger.exception("Unexpected error during token verification: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        ) from exc


# Convenience type alias — use this in route function signatures
AuthToken = Annotated[dict, Depends(require_auth)]
