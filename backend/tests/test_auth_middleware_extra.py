"""Unit tests for the authentication middleware.

Tests the require_auth dependency with various token verification responses.
"""

import firebase_admin.auth
import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.middleware.auth import require_auth


@pytest.mark.asyncio
async def test_require_auth_missing_credentials() -> None:
    """Verifies require_auth raises 401 when credentials are not provided."""
    with pytest.raises(HTTPException) as exc_info:
        await require_auth(None)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Authorization header is missing" in exc_info.value.detail


@pytest.mark.asyncio
async def test_require_auth_valid_token(mocker) -> None:
    """Verifies require_auth returns the decoded token payload on success."""
    payload = {"uid": "user-123", "email": "user@example.com"}
    mocker.patch("firebase_admin.auth.verify_id_token", return_value=payload)

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid-token")
    result = await require_auth(credentials)

    assert result == payload


@pytest.mark.asyncio
async def test_require_auth_expired_token(mocker) -> None:
    """Verifies require_auth raises 401 when the token is expired."""
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=firebase_admin.auth.ExpiredIdTokenError("Token expired"),
    )

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="expired-token")
    with pytest.raises(HTTPException) as exc_info:
        await require_auth(credentials)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "expired" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_require_auth_invalid_token(mocker) -> None:
    """Verifies require_auth raises 401 when the token is invalid."""
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=firebase_admin.auth.InvalidIdTokenError("Token invalid"),
    )

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid-token")
    with pytest.raises(HTTPException) as exc_info:
        await require_auth(credentials)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "invalid" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_require_auth_revoked_token(mocker) -> None:
    """Verifies require_auth raises 401 when the token is revoked."""
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=firebase_admin.auth.RevokedIdTokenError("Token revoked"),
    )

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="revoked-token")
    with pytest.raises(HTTPException) as exc_info:
        await require_auth(credentials)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "revoked" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_require_auth_unexpected_error(mocker) -> None:
    """Verifies require_auth raises 401 when verify_id_token throws an unexpected exception."""
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=RuntimeError("Some internal authentication SDK error"),
    )

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="buggy-token")
    with pytest.raises(HTTPException) as exc_info:
        await require_auth(credentials)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "failed" in exc_info.value.detail.lower()
