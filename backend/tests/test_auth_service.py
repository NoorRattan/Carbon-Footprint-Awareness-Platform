"""Unit tests for the authentication helper services.

Covers create_or_update_user_on_login with standard inputs and exception paths.
"""

from unittest.mock import AsyncMock

import pytest

from app.services.auth_service import create_or_update_user_on_login


@pytest.mark.asyncio
async def test_create_or_update_user_on_login_success(mocker) -> None:
    """Verifies user sync handles a complete token profile correctly."""
    mock_upsert = mocker.patch("app.services.auth_service.upsert_user", new_callable=AsyncMock)

    token = {"email": "john.doe@example.com", "name": "John Doe"}

    await create_or_update_user_on_login("uid-abc-123", token)

    mock_upsert.assert_called_once()
    kwargs = mock_upsert.call_args.kwargs
    assert kwargs["uid"] == "uid-abc-123"
    assert kwargs["email"] == "john.doe@example.com"
    assert kwargs["display_name"] == "John Doe"
    assert "last_seen" in kwargs


@pytest.mark.asyncio
async def test_create_or_update_user_on_login_fallback_name(mocker) -> None:
    """Verifies that the display name defaults to the email prefix if name is missing."""
    mock_upsert = mocker.patch("app.services.auth_service.upsert_user", new_callable=AsyncMock)

    token = {"email": "janedoe@example.com"}

    await create_or_update_user_on_login("uid-xyz-789", token)

    mock_upsert.assert_called_once()
    kwargs = mock_upsert.call_args.kwargs
    assert kwargs["uid"] == "uid-xyz-789"
    assert kwargs["email"] == "janedoe@example.com"
    assert kwargs["display_name"] == "janedoe"
    assert "last_seen" in kwargs


@pytest.mark.asyncio
async def test_create_or_update_user_on_login_handles_exception(mocker) -> None:
    """Verifies that errors during user upsert are caught and logged, not raised."""
    mocker.patch(
        "app.services.auth_service.upsert_user", side_effect=Exception("Database connection error")
    )

    # Should not raise an exception
    await create_or_update_user_on_login("uid-fail-456", {"email": "fail@example.com"})
