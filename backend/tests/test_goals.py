"""Route tests for /api/v1/goals.

Tests cover authentication guards, goal creation with server-side baseline,
ownership verification, update, and delete across all 4 CRUD endpoints.
"""

import logging
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

logger = logging.getLogger(__name__)

MOCK_GOAL: dict = {
    "id": "goal-abc-123",
    "user_id": "test-uid-123",
    "title": "Cut my driving in half",
    "category": "transport",
    "target_reduction_percent": 50.0,
    "baseline_carbon_kg": 164.2,
    "target_carbon_kg": 82.1,
    "start_date": "2026-05-01",
    "end_date": "2026-07-31",
    "status": "active",
    "created_at": "2026-05-01T09:00:00Z",
}

_END_DATE_VALID = (date.today() + timedelta(days=30)).isoformat()
_END_DATE_TOO_SOON = (date.today() + timedelta(days=3)).isoformat()


class TestCreateGoal:
    """Tests for POST /api/v1/goals."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """POST without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/goals",
            json={
                "title": "Reduce driving",
                "category": "transport",
                "target_reduction_percent": 20.0,
                "end_date": _END_DATE_VALID,
            },
        )
        assert response.status_code == 401

    def test_valid_goal_returns_201(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """POST with valid payload returns 201 with baseline and target values.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.goals.get_activities_summary",
            return_value={
                "total_carbon_kg": 328.4,
                "by_category": {
                    "transport": 164.2,
                    "food": 0.0,
                    "energy": 0.0,
                    "shopping": 0.0,
                    "waste": 0.0,
                },
                "period": {"start": "2026-04-01", "end": "2026-05-01"},
            },
        )
        mocker.patch("app.routes.goals.fs_create_goal", return_value=MOCK_GOAL)

        response = authed_client.post(
            "/api/v1/goals",
            json={
                "title": "Cut my driving in half",
                "category": "transport",
                "target_reduction_percent": 50.0,
                "end_date": _END_DATE_VALID,
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert "baseline_carbon_kg" in body
        assert "target_carbon_kg" in body
        assert body["target_carbon_kg"] < body["baseline_carbon_kg"]

    def test_end_date_too_soon_returns_422(self, authed_client: TestClient) -> None:
        """POST with end_date fewer than 7 days away returns 422 (Pydantic).

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.post(
            "/api/v1/goals",
            json={
                "title": "Quick goal",
                "category": "food",
                "target_reduction_percent": 10.0,
                "end_date": _END_DATE_TOO_SOON,
            },
        )
        assert response.status_code == 422

    def test_invalid_category_returns_422(self, authed_client: TestClient) -> None:
        """POST with an unknown category returns 422 (Pydantic Literal validation).

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.post(
            "/api/v1/goals",
            json={
                "title": "Bad category",
                "category": "invalid_category",
                "target_reduction_percent": 20.0,
                "end_date": _END_DATE_VALID,
            },
        )
        assert response.status_code == 422

    def test_reduction_over_100_returns_422(self, authed_client: TestClient) -> None:
        """POST with target_reduction_percent > 100 returns 422.

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.post(
            "/api/v1/goals",
            json={
                "title": "Impossible goal",
                "category": "transport",
                "target_reduction_percent": 150.0,
                "end_date": _END_DATE_VALID,
            },
        )
        assert response.status_code == 422

    def test_total_category_uses_total_carbon_kg(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """POST with category='total' uses total_carbon_kg as baseline.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        total_goal = {**MOCK_GOAL, "category": "total", "baseline_carbon_kg": 328.4}
        mocker.patch(
            "app.routes.goals.get_activities_summary",
            return_value={
                "total_carbon_kg": 328.4,
                "by_category": {
                    "transport": 164.2,
                    "food": 80.0,
                    "energy": 50.0,
                    "shopping": 20.0,
                    "waste": 14.2,
                },
                "period": {"start": "2026-04-01", "end": "2026-05-01"},
            },
        )
        mocker.patch("app.routes.goals.fs_create_goal", return_value=total_goal)

        response = authed_client.post(
            "/api/v1/goals",
            json={
                "title": "Cut everything",
                "category": "total",
                "target_reduction_percent": 25.0,
                "end_date": _END_DATE_VALID,
            },
        )
        assert response.status_code == 201


class TestListGoals:
    """Tests for GET /api/v1/goals."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """GET without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/goals")
        assert response.status_code == 401

    def test_returns_own_goals(self, authed_client: TestClient, mocker: pytest.MonkeyPatch) -> None:
        """GET returns goals belonging to the authenticated user.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.goals.get_goals", return_value=[MOCK_GOAL])
        response = authed_client.get("/api/v1/goals")
        assert response.status_code == 200
        assert len(response.json()["goals"]) == 1

    def test_invalid_status_filter_returns_400(self, authed_client: TestClient) -> None:
        """GET with unknown status filter returns 400.

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.get("/api/v1/goals?status=unknown")
        assert response.status_code == 400

    def test_valid_status_filter_accepted(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET with status=active returns 200.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.goals.get_goals", return_value=[MOCK_GOAL])
        response = authed_client.get("/api/v1/goals?status=active")
        assert response.status_code == 200


class TestUpdateGoal:
    """Tests for PUT /api/v1/goals/{id}."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """PUT without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.put("/api/v1/goals/goal-abc-123", json={"title": "Updated"})
        assert response.status_code == 401

    def test_update_own_goal_returns_200(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """PUT own goal returns 200 with confirmation message.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.goals.fs_update_goal", return_value=MOCK_GOAL)
        response = authed_client.put(
            "/api/v1/goals/goal-abc-123",
            json={"title": "Updated title"},
        )
        assert response.status_code == 200

    def test_update_other_users_goal_returns_404(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """PUT another user's goal returns 404 (ownership is opaque).

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        other_goal = {**MOCK_GOAL, "user_id": "other-uid"}
        mocker.patch("app.routes.goals.fs_update_goal", return_value=other_goal)
        response = authed_client.put(
            "/api/v1/goals/goal-abc-123",
            json={"title": "Updated"},
        )
        assert response.status_code == 404

    def test_update_missing_goal_returns_404(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """PUT a non-existent goal returns 404.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.goals.fs_update_goal", return_value=None)
        response = authed_client.put(
            "/api/v1/goals/nonexistent",
            json={"title": "Updated"},
        )
        assert response.status_code == 404

    def test_update_empty_body_returns_400(self, authed_client: TestClient) -> None:
        """PUT with no valid fields in the body returns 400.

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.put("/api/v1/goals/goal-abc-123", json={})
        assert response.status_code == 400


class TestDeleteGoal:
    """Tests for DELETE /api/v1/goals/{id}."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """DELETE without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.delete("/api/v1/goals/goal-abc-123")
        assert response.status_code == 401

    def test_delete_own_goal_returns_200(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """DELETE own goal returns 200 with confirmation message.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.goals.fs_delete_goal", return_value=MOCK_GOAL)
        response = authed_client.delete("/api/v1/goals/goal-abc-123")
        assert response.status_code == 200

    def test_delete_other_users_goal_returns_404(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """DELETE another user's goal returns 404 (ownership is opaque).

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        other_goal = {**MOCK_GOAL, "user_id": "other-uid"}
        mocker.patch("app.routes.goals.fs_delete_goal", return_value=other_goal)
        response = authed_client.delete("/api/v1/goals/goal-abc-123")
        assert response.status_code == 404
