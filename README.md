# EcoTrack — Carbon Footprint Awareness Platform

EcoTrack helps individuals understand, track, and reduce their personal carbon
footprint through practical education, simple daily activity logging, verified
emission factors, and AI-powered personalised recommendations.

## Live Demo

- **App:** https://ecotrack-app-2026.web.app
- **API Health:** https://ecotrack-api-[hash]-uc.a.run.app/api/v1/health

## What It Does

- 🌱 **Understand** — Five categories of educational articles explain where
  emissions come from, backed by DESNZ, EPA, IPCC, IEA, WRAP, and Our World in
  Data sources
- 📊 **Track** — Log daily activities across transport, food, energy, shopping,
  and waste using verified emission factors in kg CO2e per unit
- 💡 **Reduce** — A personalised recommendation engine analyses activity
  history and ranks actions by estimated annual CO2e saving

## Architecture

```text
Browser
  -> Firebase Hosting (CDN)
      -> React 18 SPA (TypeScript, Vite, Tailwind)
          -> Cloud Run API (FastAPI, Python 3.11)
              -> Cloud Firestore (NoSQL)
              -> Firebase Auth (JWT verification)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript strict, Vite 5, Tailwind CSS v3 |
| Backend | FastAPI, Python 3.11, Pydantic v2 |
| Database | Google Cloud Firestore native mode |
| Auth | Firebase Auth with Google OAuth and email/password |
| Hosting | Firebase Hosting for the frontend, Cloud Run for the backend |
| CI/CD | GitHub Actions |

## Local Setup

### Prerequisites

- Node.js 20 LTS
- Python 3.11
- A Firebase project with Firestore and Auth enabled

### Backend

```bash
cd backend
cp .env.example .env
pip install -r requirements-dev.txt
uvicorn main:app --reload
```

Fill `backend/.env` with your Firebase and API configuration before starting
the server.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Fill `frontend/.env` with your Firebase web configuration and API URL.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Path to the Firebase service account JSON |
| `ENVIRONMENT` | `development`, `test`, or `production` |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs allowed by CORS |
| `SECRET_KEY` | Random string at least 32 characters long |
| `RATE_LIMIT_PER_MINUTE` | API rate limit per IP, default `60` |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL ending in `/api/v1` |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |

## Running Tests

### Backend

```bash
cd backend
pytest tests/ --cov=app --cov-report=term-missing --cov-fail-under=80
ruff check . && ruff format --check .
python -m pip_audit -r requirements.txt
```

Coverage target: at least 80%.

### Frontend

```bash
cd frontend
npm run lint
npx prettier --check "src/**/*.{ts,tsx}"
npm run test:coverage
npm run build
npm audit --audit-level=moderate
```

Coverage target: at least 70% lines, functions, and statements, with at least
65% branches.

## Deployment

Push to `main` after the required GitHub secrets are configured. GitHub Actions
runs backend tests, deploys the API to Cloud Run, builds and verifies the
frontend, then deploys Firebase Hosting.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for first-time setup instructions.

## Data Sources

- [UK DESNZ GHG Conversion Factors 2024](https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting)
- [US EPA Emission Factors for Greenhouse Gas Inventories 2024](https://www.epa.gov/climateleadership/ghg-emission-factors-hub)
- [IPCC Fifth Assessment Report — Global Warming Potentials](https://www.ipcc.ch/assessment-report/ar5/)
- [Our World in Data — Food and Land Use](https://ourworldindata.org/environmental-impacts-of-food)
- [IEA Electricity Emission Factors 2023](https://www.iea.org/data-and-statistics/data-product/emissions-factors-2023)

## Accessibility

EcoTrack targets WCAG 2.1 AA compliance. Pages include skip navigation, clear
heading hierarchy, keyboard-visible focus states, ARIA labels on interactive
controls and charts, semantic forms, and reduced-motion support.

## Known Limitations

- Rate limiting uses in-memory counters per Cloud Run instance. Under high load
  with multiple instances active, limits are not shared across instances.
  Pydantic validation provides the primary abuse defence.

## License

MIT
