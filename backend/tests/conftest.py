"""pytest fixtures shared across all test modules.

Firebase Admin SDK and Google Cloud Firestore are mocked at the sys.modules
level BEFORE any app import so that no real credentials are required during
the test run. This is the only reliable way to prevent Firebase from
attempting initialisation during collection.
"""

import logging
import os
import sys
from collections.abc import Generator
from unittest.mock import MagicMock

import pytest

# ---------------------------------------------------------------------------
# Module-level Firebase / Firestore mocks — MUST happen before any app import
# ---------------------------------------------------------------------------
_google_mock = MagicMock()
_google_cloud_mock = MagicMock()
_firestore_mock = MagicMock()
_firestore_v1_mock = MagicMock()

# Wire the mock hierarchy so attribute access resolves correctly
_google_mock.cloud = _google_cloud_mock
_google_cloud_mock.firestore = _firestore_mock

_fb_admin_mock = MagicMock()
_fb_auth_mock = MagicMock()
_fb_credentials_mock = MagicMock()


# Create proper stub classes that inherit from Exception
class _InvalidIdTokenError(Exception):  # noqa: N818
    """Stub for firebase_admin.auth.InvalidIdTokenError used in tests."""


class _ExpiredIdTokenError(Exception):  # noqa: N818
    """Stub for firebase_admin.auth.ExpiredIdTokenError used in tests."""


class _RevokedIdTokenError(Exception):  # noqa: N818
    """Stub for firebase_admin.auth.RevokedIdTokenError used in tests."""


_fb_auth_mock.InvalidIdTokenError = _InvalidIdTokenError
_fb_auth_mock.ExpiredIdTokenError = _ExpiredIdTokenError
_fb_auth_mock.RevokedIdTokenError = _RevokedIdTokenError

# verify_id_token raises by default — tests that need a valid token must
# either use authed_client (which overrides require_auth entirely) or mock it.
_fb_auth_mock.verify_id_token.side_effect = _InvalidIdTokenError("invalid token")

# Wire admin mock so firebase_admin.auth resolves to _fb_auth_mock in auth.py
# (plain MagicMock auto-creates new children, so we must wire explicitly)
_fb_admin_mock.auth = _fb_auth_mock

sys.modules["google"] = _google_mock
sys.modules["google.cloud"] = _google_cloud_mock
sys.modules["firebase_admin"] = _fb_admin_mock
sys.modules["firebase_admin.auth"] = _fb_auth_mock
sys.modules["firebase_admin.credentials"] = _fb_credentials_mock
sys.modules["google.cloud.firestore"] = _firestore_mock
sys.modules["google.cloud.firestore_v1"] = _firestore_v1_mock

os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "test-project")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("FIREBASE_SERVICE_ACCOUNT_KEY", "nonexistent.json")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-minimum-xx")
os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "60")

# ---------------------------------------------------------------------------
# App imports — safe after sys.modules patching
# ---------------------------------------------------------------------------
from fastapi.testclient import TestClient  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.middleware.auth import require_auth  # noqa: E402
from main import app  # noqa: E402

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared mock data
# ---------------------------------------------------------------------------

MOCK_ACTIVITY: dict = {
    "id": "act-abc-123",
    "user_id": "test-uid-123",
    "category": "transport",
    "subcategory": "car_petrol",
    "amount": 25.0,
    "unit": "km",
    "carbon_kg": 4.8,
    "date": "2026-05-01",
    "notes": None,
    "created_at": "2026-05-01T09:00:00Z",
}

MOCK_USER: dict = {
    "uid": "test-uid-123",
    "email": "test@example.com",
    "display_name": "Test User",
    "region": "UK",
    "diet_type": "average",
    "household_size": 1,
    "created_at": "2026-01-01T00:00:00+00:00",
    "streak": 3,
    "badges": [],
    "total_carbon_kg": 42.0,
    "monthly_totals": {},
    "last_log_date": "2026-04-30",
    "last_seen": "2026-05-01T09:00:00+00:00",
}


# ---------------------------------------------------------------------------
# Synchronous TestClient fixtures (primary — used by new tests)
# ---------------------------------------------------------------------------


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Synchronous TestClient for unauthenticated endpoint tests.

    Dependency overrides are cleared before each use to prevent leakage
    from authed_client fixtures in other test modules.

    Returns:
        Configured TestClient bound to the FastAPI app.
    """
    app.dependency_overrides.clear()
    with TestClient(app, raise_server_exceptions=True) as tc:
        yield tc
    app.dependency_overrides.clear()


@pytest.fixture
def auth_token() -> dict:
    """Fake decoded Firebase token dict used to override require_auth.

    Returns:
        Dict mimicking a decoded Firebase ID token.
    """
    return {"uid": "test-uid-123", "email": "test@example.com", "name": "Test User"}


@pytest.fixture
def authed_client(auth_token: dict) -> Generator[TestClient, None, None]:
    """Synchronous TestClient with require_auth dependency overridden.

    Args:
        auth_token: Fake decoded Firebase token fixture.

    Returns:
        TestClient that bypasses Firebase token verification.
    """

    async def override_auth() -> dict:
        """Return a fake auth token without contacting Firebase.

        Returns:
            Fake decoded Firebase ID token dict.
        """
        return auth_token

    app.dependency_overrides[require_auth] = override_auth
    with TestClient(app, raise_server_exceptions=True) as tc:
        yield tc
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Async AsyncClient fixture (backwards-compat for existing async test modules)
# ---------------------------------------------------------------------------


@pytest.fixture
async def async_client() -> AsyncClient:
    """Async HTTP client wired to the FastAPI test application.

    Used by legacy test modules that were written with async tests.

    Returns:
        Configured AsyncClient for making async test requests.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac
