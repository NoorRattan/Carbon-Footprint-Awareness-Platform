"""pytest fixtures shared across all test modules.

Provides the async HTTP test client and Firebase auth mock so that
individual test modules do not need to repeat setup boilerplate.
"""
import logging

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

logger = logging.getLogger(__name__)


@pytest.fixture(scope="session", autouse=True)
def configure_test_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Set ENVIRONMENT=test before any test imports settings.

    Args:
        monkeypatch: pytest monkeypatch fixture for environment variable injection.
    """
    monkeypatch.setenv("ENVIRONMENT", "test")
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_KEY", "fake-key.json")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-32-chars-minimum!")


@pytest.fixture(scope="session")
def test_app() -> FastAPI:
    """Return the FastAPI application configured for testing.

    Firebase initialisation is skipped via the firebase_admin._apps mock.
    Routers are registered as in production so route resolution is tested.

    Returns:
        FastAPI application instance ready for test requests.
    """
    import firebase_admin

    # Prevent real Firebase init during tests
    if not firebase_admin._apps:
        firebase_admin._apps["[DEFAULT]"] = object()  # type: ignore[assignment]

    from main import app

    return app


@pytest_asyncio.fixture
async def client(test_app: FastAPI) -> AsyncClient:
    """Async HTTP client wired to the test FastAPI application.

    Args:
        test_app: The FastAPI application fixture.

    Returns:
        Configured AsyncClient for making test requests.
    """
    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://testserver",
    ) as ac:
        yield ac
