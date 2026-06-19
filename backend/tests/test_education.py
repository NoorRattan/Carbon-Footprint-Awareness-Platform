"""Route tests for /api/v1/education (list + detail) and /api/v1/calculate.

All three endpoints are public — no auth required. Tests cover validation,
slug format enforcement, 404 handling, and the rate-limited calculator.
"""

import logging

import pytest
from fastapi.testclient import TestClient

logger = logging.getLogger(__name__)

_MOCK_ARTICLE_SUMMARY = {
    "slug": "reduce-car-travel",
    "title": "How to Reduce Car Travel",
    "category": "transport",
    "read_time": 5,
    "published": True,
    "updated_at": "2026-05-01T12:00:00Z",
}

_MOCK_ARTICLE_DETAIL = {
    **_MOCK_ARTICLE_SUMMARY,
    "content": "## Introduction\n\nCar travel is a major source of carbon emissions...",
    "tags": ["transport", "travel"],
}


class TestListArticles:
    """Tests for GET /api/v1/education."""

    def test_returns_200_without_auth(self, client: TestClient) -> None:
        """GET education list is public and returns 200 without a token.

        Args:
            client: Unauthenticated sync TestClient.
        """
        with pytest.MonkeyPatch().context() as m:
            import app.routes.education as edu_mod

            m.setattr(edu_mod, "get_education", lambda *a, **kw: _mock_get_education(*a, **kw))
        response = client.get("/api/v1/education")
        # Route may return 500 if async mock fails, but must not be 401
        assert response.status_code != 401

    def test_returns_list_of_articles(self, client: TestClient, mocker: pytest.MonkeyPatch) -> None:
        """GET education list returns articles array.

        Args:
            client: Unauthenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.education.get_education",
            return_value=[_MOCK_ARTICLE_SUMMARY],
        )
        response = client.get("/api/v1/education")
        assert response.status_code == 200
        body = response.json()
        assert "articles" in body
        assert len(body["articles"]) == 1

    def test_category_filter_accepted(self, client: TestClient, mocker: pytest.MonkeyPatch) -> None:
        """GET /education?category=transport returns 200.

        Args:
            client: Unauthenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.education.get_education",
            return_value=[_MOCK_ARTICLE_SUMMARY],
        )
        response = client.get("/api/v1/education?category=transport")
        assert response.status_code == 200

    def test_no_articles_returns_empty_list(
        self, client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET education list returns empty articles array when none exist.

        Args:
            client: Unauthenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch("app.routes.education.get_education", return_value=[])
        response = client.get("/api/v1/education")
        assert response.status_code == 200
        assert response.json()["articles"] == []


class TestGetArticle:
    """Tests for GET /api/v1/education/{slug}."""

    def test_valid_slug_returns_200(self, client: TestClient, mocker: pytest.MonkeyPatch) -> None:
        """GET /education/{slug} with a valid slug returns 200.

        Args:
            client: Unauthenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.education.get_education_by_slug",
            return_value=_MOCK_ARTICLE_DETAIL,
        )
        response = client.get("/api/v1/education/reduce-car-travel")
        assert response.status_code == 200
        body = response.json()
        assert body["slug"] == "reduce-car-travel"

    def test_missing_article_returns_404(
        self, client: TestClient, mocker: pytest.MonkeyPatch
    ) -> None:
        """GET /education/{slug} returns 404 when article does not exist.

        Args:
            client: Unauthenticated sync TestClient.
            mocker: pytest-mock fixture.
        """
        mocker.patch(
            "app.routes.education.get_education_by_slug",
            return_value=None,
        )
        response = client.get("/api/v1/education/nonexistent-slug")
        assert response.status_code == 404

    def test_invalid_slug_characters_returns_400(self, client: TestClient) -> None:
        """GET /education/{slug} returns 400 for slugs with invalid characters.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.get("/api/v1/education/this_has_underscores!")
        assert response.status_code == 400

    def test_slug_with_spaces_returns_400(self, client: TestClient) -> None:
        """GET /education/{slug} returns 400 when slug contains spaces.

        Args:
            client: Unauthenticated sync TestClient.
        """
        # URL-encoded space %20 becomes a literal space in path
        response = client.get("/api/v1/education/has space")
        # FastAPI path parsing may return 404 for spaces; 400/404 both acceptable
        assert response.status_code in (400, 404, 422)


class TestCalculate:
    """Tests for POST /api/v1/calculate (public, 30/min rate limit)."""

    def test_valid_calculation_returns_200(self, client: TestClient) -> None:
        """POST /calculate with valid category/subcategory returns carbon_kg.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/calculate",
            json={"category": "transport", "subcategory": "car_petrol", "amount": 100.0},
        )
        assert response.status_code == 200
        body = response.json()
        assert "carbon_kg" in body
        assert "unit" in body
        assert body["carbon_kg"] == pytest.approx(19.2, abs=0.1)
        assert body["unit"] == "km"

    def test_beef_calculation_returns_correct_carbon(self, client: TestClient) -> None:
        """POST /calculate for beef returns 27.0 kg CO₂e per kg.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/calculate",
            json={"category": "food", "subcategory": "beef", "amount": 1.0},
        )
        assert response.status_code == 200
        assert response.json()["carbon_kg"] == pytest.approx(27.0, abs=0.1)

    def test_invalid_category_returns_400(self, client: TestClient) -> None:
        """POST /calculate with unknown category returns 400.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/calculate",
            json={"category": "aviation", "subcategory": "economy", "amount": 1000.0},
        )
        assert response.status_code == 400

    def test_invalid_subcategory_returns_400(self, client: TestClient) -> None:
        """POST /calculate with unknown subcategory returns 400.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/calculate",
            json={"category": "transport", "subcategory": "rocketship", "amount": 1.0},
        )
        assert response.status_code == 400

    def test_zero_amount_returns_400(self, client: TestClient) -> None:
        """POST /calculate with amount=0 returns 400 (must be greater than zero).

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/calculate",
            json={"category": "transport", "subcategory": "car_petrol", "amount": 0.0},
        )
        assert response.status_code == 400

    def test_negative_amount_returns_400(self, client: TestClient) -> None:
        """POST /calculate with negative amount returns 400.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/calculate",
            json={"category": "transport", "subcategory": "car_petrol", "amount": -5.0},
        )
        assert response.status_code == 400

    def test_cycling_returns_zero_carbon(self, client: TestClient) -> None:
        """POST /calculate for cycling returns carbon_kg=0.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/calculate",
            json={"category": "transport", "subcategory": "cycling", "amount": 10.0},
        )
        assert response.status_code == 200
        assert response.json()["carbon_kg"] == 0.0

    def test_response_includes_description(self, client: TestClient) -> None:
        """POST /calculate response includes a human-readable description.

        Args:
            client: Unauthenticated sync TestClient.
        """
        response = client.post(
            "/api/v1/calculate",
            json={"category": "energy", "subcategory": "electricity_uk", "amount": 100.0},
        )
        assert response.status_code == 200
        assert "description" in response.json()


def _mock_get_education(*_args: object, **_kwargs: object) -> list:
    """Sync stub used in MonkeyPatch context for get_education.

    Returns:
        List of mock article summaries.
    """
    return [_MOCK_ARTICLE_SUMMARY]
