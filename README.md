# EcoTrack — Carbon Footprint Awareness Platform

EcoTrack helps individuals understand, track, and reduce their personal carbon footprint
through activity logging, real emission-factor data, and a personalised AI-powered
recommendation engine.

## Three Core Pillars

| Pillar | Path | Description |
|--------|------|-------------|
| **Understand** | `/learn` | 5 education articles, one per emission category, with cited data sources |
| **Track** | `/log` | Activity form with 50+ subcategories and live carbon estimates |
| **Reduce** | `/insights` | SmartAdvisor with 9 recommendation rules ranked by estimated annual CO₂e saving |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.11 |
| Framework | FastAPI (async) |
| Database | Google Cloud Firestore (native mode) |
| Auth | Firebase Admin SDK — JWT on every protected endpoint |
| Deployment | Google Cloud Run |
| Container | `python:3.11-slim` |
| Linting | `ruff` — zero tolerance |
| Tests | `pytest` + `pytest-asyncio` + `pytest-mock` |
| Rate limiting | `slowapi` (per-IP, in-memory) |

---

## Backend

### Directory Structure

```
backend/
├── Dockerfile
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml          # ruff + coverage config
├── pytest.ini              # asyncio_mode = auto
├── .env.example            # copy to .env and fill values
├── main.py                 # FastAPI app entry point
└── app/
    ├── config.py           # pydantic-settings, lru_cache singleton
    ├── limiter.py          # slowapi Limiter singleton
    ├── middleware/
    │   └── auth.py         # Firebase JWT dependency
    ├── models/
    │   ├── activity.py
    │   ├── education.py
    │   ├── goal.py
    │   ├── insight.py
    │   └── user.py
    └── routes/
        ├── activities.py
        ├── education.py
        ├── goals.py
        ├── insights.py
        └── user.py
```

### Local Development Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dev dependencies
pip install -r requirements-dev.txt

# Configure environment
copy .env.example .env
# Edit .env — set FIREBASE_SERVICE_ACCOUNT_KEY to your downloaded JSON path

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

API documentation is available at `http://localhost:8080/docs` in development.

### Running Tests

```bash
cd backend
pytest --cov=app --cov-report=term-missing
```

Coverage is enforced at ≥80% line coverage in CI.

### Linting

```bash
cd backend
ruff check .
ruff format --check .
```

Zero ruff errors are required. The CI pipeline will fail on any lint issue.

### Docker Build

```bash
cd backend
docker build -t ecotrack-backend .
docker run -p 8080:8080 --env-file .env ecotrack-backend
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | Public | Health check |
| GET | `/api/v1/activities` | ★ | List user activities |
| POST | `/api/v1/activities` | ★ | Log a new activity |
| DELETE | `/api/v1/activities/{id}` | ★ | Delete an activity |
| GET | `/api/v1/activities/summary` | ★ | Carbon totals by category |
| GET | `/api/v1/insights` | ★ | SmartAdvisor recommendations |
| POST | `/api/v1/insights/acknowledge/{id}` | ★ | Acknowledge a recommendation |
| GET | `/api/v1/goals` | ★ | List reduction goals |
| POST | `/api/v1/goals` | ★ | Create a reduction goal |
| PUT | `/api/v1/goals/{id}` | ★ | Update a goal |
| DELETE | `/api/v1/goals/{id}` | ★ | Delete a goal |
| GET | `/api/v1/user/profile` | ★ | Get user profile |
| PUT | `/api/v1/user/profile` | ★ | Update user profile |
| DELETE | `/api/v1/user/account` | ★ | Delete account (GDPR) |
| GET | `/api/v1/education` | Public | List education articles |
| GET | `/api/v1/education/{slug}` | Public | Get article detail |

★ Requires `Authorization: Bearer <Firebase ID token>` header.

---

## Security

- **HTTPS only** — Cloud Run enforces HTTP→HTTPS redirect.
- **CORS strict allowlist** — configured via `ALLOWED_ORIGINS` env var; wildcard is never used in production.
- **JWT verification** — `firebase_admin.auth.verify_id_token()` called via `run_in_executor` (non-blocking).
- **Ownership enforcement** — resources belonging to another user return `404`, not `403`, to prevent information leakage.
- **Input validation** — all request bodies validated by Pydantic v2.
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `HSTS` (production) on every response.
- **Secrets via env vars** — no credentials are hardcoded.
- **`carbon_kg` server-side only** — never accepted from the client; always computed from emission factors.
- **GDPR** — `DELETE /api/v1/user/account` permanently wipes all user data from Firestore.

## Known Limitations

- **Rate limiting is per-instance**: `slowapi` uses in-memory counters. On Cloud Run with multiple instances, rate limits are not shared across instances. Pydantic validation is the primary defence against malformed input abuse. A distributed rate limiting solution (e.g., Redis) can be added if required.

---

## GCP Project

**Project ID:** `ecotrack-app-2026`

Deployed on Google Cloud Run. Firestore database is in native mode.
