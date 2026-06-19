"""Route tests for /api/v1/insights.

Tests cover authentication guard, cache freshness logic, recommendation
generation, cache staleness refresh, and the acknowledge endpoint.
"""

import logging
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from tests.conftest import MOCK_USER

logger = logging.getLogger(__name__)

_MOCK_CACHED_INSIGHTS = {
    "footprint_kg": 42.5,
    "top_category": "transport",
    "monthly_change_percent": -5.0,
    "vs_average_percent": -30.0,
    "recommendations": [],
    "achievements": ["first_log"],
    "generated_at": (datetime.now(UTC) - timedelta(hours=1)).isoformat(),
    "period": "last_30_days",
}

_STALE_CACHED_INSIGHTS = {
    **_MOCK_CACHED_INSIGHTS,
    "generated_at": (datetime.now(UTC) - timedelta(hours=7)).isoformat(),
}


class TestGetInsights:
    """Tests for GET /api/v1/insights."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """GET without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/insights")
        assert response.status_code == 401

    def test_no_activities_returns_200_empty_recommendations(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET with no activities returns 200 with an empty recommendations list.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.insights.get_insights", return_value=None)
        mocker.patch("app.routes.insights.get_activities", return_value=[])
        mocker.patch("app.routes.insights.get_user", return_value=MOCK_USER)
        mocker.patch("app.routes.insights.save_insights", return_value=None)

        response = authed_client.get("/api/v1/insights")
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body["recommendations"], list)
        assert len(body["recommendations"]) == 0

    def test_generates_recommendations_for_active_user(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET generates recommendations when the user has carbon-heavy activities.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        activities = [
            {
                "id": "act-1",
                "user_id": "test-uid-123",
                "category": "transport",
                "subcategory": "car_petrol",
                "amount": 500.0,
                "unit": "km",
                "carbon_kg": 96.0,
                "date": "2026-05-01",
                "notes": None,
                "created_at": "2026-05-01T09:00:00Z",
            },
            {
                "id": "act-2",
                "user_id": "test-uid-123",
                "category": "food",
                "subcategory": "beef",
                "amount": 5.0,
                "unit": "kg",
                "carbon_kg": 135.0,
                "date": "2026-05-02",
                "notes": None,
                "created_at": "2026-05-02T09:00:00Z",
            },
        ]
        mocker.patch("app.routes.insights.get_insights", return_value=None)
        mocker.patch("app.routes.insights.get_activities", return_value=activities)
        mocker.patch("app.routes.insights.get_user", return_value=MOCK_USER)
        mocker.patch("app.routes.insights.save_insights", return_value=None)

        response = authed_client.get("/api/v1/insights")
        assert response.status_code == 200
        body = response.json()
        recs = body["recommendations"]
        assert len(recs) > 0
        # Recommendations must be sorted by estimated_saving_kg DESC
        savings = [r["estimated_saving_kg"] for r in recs]
        assert savings == sorted(savings, reverse=True)

    def test_returns_cached_if_fresh(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET returns cached insights without calling get_activities when cache is fresh.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.insights.get_insights", return_value=_MOCK_CACHED_INSIGHTS)
        get_activities_mock = mocker.patch("app.routes.insights.get_activities")

        response = authed_client.get("/api/v1/insights")
        assert response.status_code == 200
        get_activities_mock.assert_not_called()

    def test_regenerates_if_cache_stale(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET regenerates and saves insights when cache is older than 6 hours.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.insights.get_insights", return_value=_STALE_CACHED_INSIGHTS)
        mocker.patch("app.routes.insights.get_activities", return_value=[])
        mocker.patch("app.routes.insights.get_user", return_value=MOCK_USER)
        save_mock = mocker.patch("app.routes.insights.save_insights", return_value=None)

        response = authed_client.get("/api/v1/insights")
        assert response.status_code == 200
        save_mock.assert_called_once()

    def test_creates_fallback_profile_when_user_not_found(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET creates a fallback profile from the auth token when user doc is absent.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.insights.get_insights", return_value=None)
        mocker.patch("app.routes.insights.get_activities", return_value=[])
        mocker.patch("app.routes.insights.get_user", return_value=None)
        mocker.patch("app.routes.insights.save_insights", return_value=None)

        response = authed_client.get("/api/v1/insights")
        # Should not 500 — falls back to creating a profile from the token
        assert response.status_code == 200


class TestAcknowledgeRecommendation:
    """Tests for POST /api/v1/insights/acknowledge/{recommendation_id}."""

    def test_no_auth_returns_401(self, client: TestClient) -> None:
        """POST acknowledge without a token returns 401.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post("/api/v1/insights/acknowledge/some_rec_id")
        assert response.status_code == 401

    def test_acknowledge_returns_200(
        self, authed_client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """POST acknowledge with valid id returns 200 and confirmation message.

        Args:
            authed_client: Authenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.insights.acknowledge_recommendation",
            return_value=None,
        )
        response = authed_client.post("/api/v1/insights/acknowledge/switch_to_public_transport")
        assert response.status_code == 200
        assert "acknowledged" in response.json()["message"].lower()
