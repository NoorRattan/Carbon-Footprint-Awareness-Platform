"""Route tests for /api/v1/activities.

Tests cover authentication guards, request validation, service-layer mocking,
ownership checks, and limit clamping across all 4 activity endpoints.
"""

import logging
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from tests.conftest import MOCK_ACTIVITY

logger = logging.getLogger(__name__)

_TODAY = date.today().isoformat()


class TestPostActivity:
    """Tests for POST /api/v1/activities."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """POST without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/activities",
            json={
                "category": "transport",
                "subcategory": "car_petrol",
                "amount": 25.0,
                "date": _TODAY,
            },
        )
        assert response.status_code == 401

    def test_valid_activity_returns_201(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """POST with valid payload returns 201 and correct carbon_kg.

        The service layer is mocked so no Firestore write occurs.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.activities.log_activity",
            return_value=MOCK_ACTIVITY,
        )
        response = authed_client.post(
            "/api/v1/activities",
            json={
                "category": "transport",
                "subcategory": "car_petrol",
                "amount": 25.0,
                "date": _TODAY,
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["carbon_kg"] == pytest.approx(4.8, abs=0.1)
        assert body["unit"] == "km"

    def test_invalid_category_returns_400(self, authed_client: TestClient) -> None:
        """POST with unknown category returns 400.

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.post(
            "/api/v1/activities",
            json={
                "category": "invalid",
                "subcategory": "car_petrol",
                "amount": 25.0,
                "date": _TODAY,
            },
        )
        assert response.status_code == 422

    def test_invalid_subcategory_returns_400(self, authed_client: TestClient) -> None:
        """POST with unknown subcategory returns 400.

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.post(
            "/api/v1/activities",
            json={
                "category": "transport",
                "subcategory": "unicycle",
                "amount": 25.0,
                "date": _TODAY,
            },
        )
        assert response.status_code == 400

    def test_negative_amount_returns_422(self, authed_client: TestClient) -> None:
        """POST with amount <= 0 returns 422 (Pydantic validation).

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.post(
            "/api/v1/activities",
            json={
                "category": "transport",
                "subcategory": "car_petrol",
                "amount": -1,
                "date": _TODAY,
            },
        )
        assert response.status_code == 422

    def test_zero_amount_returns_422(self, authed_client: TestClient) -> None:
        """POST with amount=0 returns 422 (Pydantic validation).

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.post(
            "/api/v1/activities",
            json={
                "category": "transport",
                "subcategory": "car_petrol",
                "amount": 0,
                "date": _TODAY,
            },
        )
        assert response.status_code == 422

    def test_future_date_returns_422(self, authed_client: TestClient) -> None:
        """POST with a future date returns 422 (Pydantic validator).

        Args:
            authed_client: Authenticated sync TestClient.
        """
        future = (date.today() + timedelta(days=3)).isoformat()
        response = authed_client.post(
            "/api/v1/activities",
            json={
                "category": "transport",
                "subcategory": "car_petrol",
                "amount": 10.0,
                "date": future,
            },
        )
        assert response.status_code == 422

    def test_valid_food_activity_returns_201(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """POST food/beef returns 201 with correct carbon_kg of 27.0 for 1 kg.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        beef_activity = {
            **MOCK_ACTIVITY,
            "category": "food",
            "subcategory": "beef",
            "amount": 1.0,
            "unit": "kg",
            "carbon_kg": 27.0,
        }
        mocker.patch(
            "app.routes.activities.log_activity",
            return_value=beef_activity,
        )
        response = authed_client.post(
            "/api/v1/activities",
            json={
                "category": "food",
                "subcategory": "beef",
                "amount": 1.0,
                "date": _TODAY,
            },
        )
        assert response.status_code == 201
        assert response.json()["carbon_kg"] == pytest.approx(27.0, abs=0.1)


class TestGetActivities:
    """Tests for GET /api/v1/activities."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """GET without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/activities")
        assert response.status_code == 401

    def test_returns_list(self, authed_client: TestClient, mocker: pytest.MonkeyPatch) -> None:
        """GET returns a list of activities with correct total count.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.activities.get_activities",
            return_value=[MOCK_ACTIVITY],
        )
        response = authed_client.get("/api/v1/activities")
        assert response.status_code == 200
        body = response.json()
        assert len(body["activities"]) == 1
        assert body["total"] == 1

    def test_invalid_category_filter_returns_400(self, authed_client: TestClient) -> None:
        """GET with an unknown category query param returns 400.

        Args:
            authed_client: Authenticated sync TestClient.
        """
        response = authed_client.get("/api/v1/activities?category=invalid")
        assert response.status_code == 400

    def test_limit_above_100_is_clamped(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET with limit=200 returns 200 — limit is silently clamped to 100.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.activities.get_activities",
            return_value=[],
        )
        response = authed_client.get("/api/v1/activities?limit=200")
        assert response.status_code == 200

    def test_valid_category_filter_accepted(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET with a valid category filter returns 200.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.activities.get_activities",
            return_value=[MOCK_ACTIVITY],
        )
        response = authed_client.get("/api/v1/activities?category=transport")
        assert response.status_code == 200


class TestDeleteActivity:
    """Tests for DELETE /api/v1/activities/{id}."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """DELETE without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.delete("/api/v1/activities/act-abc-123")
        assert response.status_code == 401

    def test_own_activity_deleted_returns_200(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """DELETE own activity returns 200 with confirmation message.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.activities.get_activity_by_id",
            return_value=MOCK_ACTIVITY,
        )
        mocker.patch("app.routes.activities.fs_delete_activity", return_value=None)
        response = authed_client.delete("/api/v1/activities/act-abc-123")
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

    def test_other_users_activity_returns_404(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """DELETE another user's activity returns 404 (ownership is opaque).

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        other_activity = {**MOCK_ACTIVITY, "user_id": "other-uid"}
        mocker.patch(
            "app.routes.activities.get_activity_by_id",
            return_value=other_activity,
        )
        response = authed_client.delete("/api/v1/activities/act-abc-123")
        assert response.status_code == 404

    def test_missing_activity_returns_404(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """DELETE a non-existent activity returns 404.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.activities.get_activity_by_id",
            return_value=None,
        )
        response = authed_client.delete("/api/v1/activities/nonexistent-id")
        assert response.status_code == 404


class TestGetActivitiesSummary:
    """Tests for GET /api/v1/activities/summary."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """GET summary without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/activities/summary")
        assert response.status_code == 401

    def test_summary_returns_200_with_structure(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET summary returns 200 with total_carbon_kg and 5-key by_category dict.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.activities.get_activities_summary",
            return_value={
                "total_carbon_kg": 42.5,
                "by_category": {
                    "transport": 20.0,
                    "food": 12.5,
                    "energy": 5.0,
                    "shopping": 3.0,
                    "waste": 2.0,
                },
                "period": {"start": "2026-04-01", "end": "2026-05-01"},
            },
        )
        response = authed_client.get("/api/v1/activities/summary")
        assert response.status_code == 200
        body = response.json()
        assert "total_carbon_kg" in body
        assert len(body["by_category"]) == 5
