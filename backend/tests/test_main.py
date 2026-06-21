"""Tests for the /api/v1/health endpoint and application setup."""

import logging

from httpx import AsyncClient

from app.config import Settings
from main import _build_allowed_origins

logger = logging.getLogger(__name__)


class TestCorsConfiguration:
    """Tests for strict CORS allowlist construction and middleware behavior."""

    def test_production_cors_includes_firebase_hosting_origins(self) -> None:
        """Production CORS allowlist always includes both Firebase Hosting domains."""
        settings = Settings(
            environment="production",
            allowed_origins="https://custom.example.com",
        )

        allowed_origins = _build_allowed_origins(settings)

        assert "https://ecotrack-app-2026-1.web.app" in allowed_origins
        assert "https://ecotrack-app-2026-1.firebaseapp.com" in allowed_origins
        assert "https://custom.example.com" in allowed_origins

    async def test_cors_preflight_allows_configured_origin(
        self, async_client: AsyncClient
    ) -> None:
        """CORS middleware returns allow-origin for a configured browser origin.

        Args:
            async_client: Async HTTP test client fixture.
        """
        response = await async_client.options(
            "/api/v1/education",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )

        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


class TestHealthEndpoint:
    """Tests for the public health check endpoint."""

    async def test_health_returns_200(self, async_client: AsyncClient) -> None:
        """Health check responds with HTTP 200.

        Args:
            async_client: Async HTTP test client fixture.
        """
        response = await async_client.get("/api/v1/health")
        assert response.status_code == 200

    async def test_health_response_shape(self, async_client: AsyncClient) -> None:
        """Health check response contains required keys.

        Args:
            async_client: Async HTTP test client fixture.
        """
        response = await async_client.get("/api/v1/health")
        body = response.json()
        assert "status" in body
        assert "version" in body
        assert "environment" in body

    async def test_health_status_is_ok(self, async_client: AsyncClient) -> None:
        """Health check reports status 'ok'.

        Args:
            async_client: Async HTTP test client fixture.
        """
        response = await async_client.get("/api/v1/health")
        assert response.json()["status"] == "ok"

    async def test_security_headers_present(self, async_client: AsyncClient) -> None:
        """Security headers are attached to health check response.

        Args:
            async_client: Async HTTP test client fixture.
        """
        response = await async_client.get("/api/v1/health")
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


class TestAuthMiddleware:
    """Tests for the Firebase JWT authentication dependency."""

    async def test_protected_route_without_token_returns_401(
        self, async_client: AsyncClient
    ) -> None:
        """Protected endpoints return 401 when no Authorization header is provided.

        Args:
            async_client: Async HTTP test client fixture.
        """
        response = await async_client.get("/api/v1/activities")
        assert response.status_code == 401

    async def test_protected_route_with_invalid_token_returns_401(
        self, async_client: AsyncClient
    ) -> None:
        """Protected endpoints return 401 for a malformed Bearer token.

        Args:
            async_client: Async HTTP test client fixture.
        """
        response = await async_client.get(
            "/api/v1/activities",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert response.status_code == 401

    async def test_missing_token_error_message(self, async_client: AsyncClient) -> None:
        """401 response for missing token includes a descriptive message.

        Args:
            async_client: Async HTTP test client fixture.
        """
        response = await async_client.get("/api/v1/activities")
        body = response.json()
        assert "detail" in body
