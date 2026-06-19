"""Route tests for /api/v1/user and auth behaviour.

Tests cover authentication guard verification, health checks, profile
CRUD, GDPR account deletion, and security headers.
"""

import logging

import pytest
from fastapi.testclient import TestClient

from tests.conftest import MOCK_USER

logger = logging.getLogger(__name__)


class TestHealthEndpoint:
    """Tests for GET /api/v1/health (public endpoint)."""

    def test_health_returns_200(self, client: TestClient) -> None:
        """Health check responds with HTTP 200.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_health_response_has_required_keys(self, client: TestClient) -> None:
        """Health check response contains status, version, and environment.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/health")
        body = response.json()
        assert body["status"] == "ok"
        assert "version" in body
        assert "environment" in body

    def test_health_has_security_headers(self, client: TestClient) -> None:
        """Health check response carries expected security headers.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/health")
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"


class TestAuthGuard:
    """Tests verifying that protected endpoints enforce authentication."""

    def test_activities_without_token_returns_401(self, client: TestClient) -> None:
        """GET /api/v1/activities without token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/activities")
        assert response.status_code == 401

    def test_profile_without_token_returns_401(self, client: TestClient) -> None:
        """GET /api/v1/user/profile without token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/user/profile")
        assert response.status_code == 401

    def test_goals_without_token_returns_401(self, client: TestClient) -> None:
        """GET /api/v1/goals without token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/goals")
        assert response.status_code == 401

    def test_invalid_token_returns_401(self, client: TestClient) -> None:
        """Protected endpoints return 401 for a malformed Bearer token.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get(
            "/api/v1/activities",
            headers={"Authorization": "Bearer this-is-not-a-real-token"},
        )
        assert response.status_code == 401

    def test_401_response_has_detail(self, client: TestClient) -> None:
        """401 response includes a detail field in the JSON body.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/activities")
        assert "detail" in response.json()


class TestGetProfile:
    """Tests for GET /api/v1/user/profile."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """GET profile without token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/user/profile")
        assert response.status_code == 401

    def test_get_profile_returns_200(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET profile for existing user returns 200.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.user.get_user", return_value=MOCK_USER)
        response = authed_client.get("/api/v1/user/profile")
        assert response.status_code == 200
        body = response.json()
        assert body["uid"] == "test-uid-123"
        assert "email" in body

    def test_first_login_creates_profile(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET profile auto-creates document on first login when user doc is absent.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.user.get_user",
            side_effect=[None, MOCK_USER],
        )
        mocker.patch(
            "app.routes.user.create_or_update_user_on_login",
            return_value=None,
        )
        response = authed_client.get("/api/v1/user/profile")
        assert response.status_code == 200


class TestUpdateProfile:
    """Tests for PUT /api/v1/user/profile."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """PUT profile without token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.put("/api/v1/user/profile", json={"region": "US"})
        assert response.status_code == 401

    def test_valid_update_returns_200(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """PUT profile with valid field returns 200.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.user.update_user", return_value=None)
        response = authed_client.put("/api/v1/user/profile", json={"region": "US"})
        assert response.status_code == 200

    def test_invalid_region_returns_422(self, authed_client: TestClient) -> None:
        """PUT profile with unknown region code returns 422 (Pydantic).

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.put("/api/v1/user/profile", json={"region": "MARS"})
        assert response.status_code == 422

    def test_empty_update_returns_400(self, authed_client: TestClient) -> None:
        """PUT profile with no valid fields returns 400.

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.put("/api/v1/user/profile", json={})
        assert response.status_code == 400


class TestDeleteAccount:
    """Tests for DELETE /api/v1/user/account (GDPR erasure)."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """DELETE account without token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.delete("/api/v1/user/account")
        assert response.status_code == 401

    def test_delete_account_returns_200(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """DELETE account returns 200 with a message containing 'deleted'.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.user.delete_user_data", return_value=None)
        response = authed_client.delete("/api/v1/user/account")
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()
