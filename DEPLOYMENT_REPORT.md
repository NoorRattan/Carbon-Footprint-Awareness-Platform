# EcoTrack - Deployment Report
Generated: 2026-06-20 17:22 IST

## Submission Links

| What | URL |
|---|---|
| GitHub Repository | https://github.com/NoorRattan/Carbon-Footprint-Awareness-Platform |
| Live Application | https://ecotrack-app-2026-1.web.app |
| API Health Check | https://ecotrack-api-qpaqjsc5lq-uc.a.run.app/api/v1/health |

## System Status

### Backend API

| Endpoint | Method | Status | Response |
|---|---|---|---|
| /api/v1/health | GET | PASS 200 | {"status":"ok","environment":"production","version":"1.0.0"} |
| /api/v1/education | GET | PASS 200 | 5 articles with read_time values |
| /api/v1/calculate | POST | PASS 200 | 4.8 kg CO2e for 25 km petrol |
| /api/v1/activities | GET | PASS 401 auth required | |
| /api/v1/insights | GET | PASS 401 auth required | |
| /api/v1/goals | GET | PASS 401 auth required | |
| /api/v1/user/profile | GET | PASS 401 auth required | |

### Frontend Pages

| Page | URL | Status | Notes |
|---|---|---|---|
| Home | / | PASS | Loads, primary CTAs visible, navigation works |
| Learn | /learn | PASS | 5 articles visible, filters present, numeric read times shown |
| Login | /login | PASS | Google popup opens without CSP errors; email/password auth verified end-to-end with disposable test account |
| Dashboard | /dashboard | PASS | Authenticated dashboard shows 23.1 kg CO2e, category breakdown, trend, and recommendations |
| Log Activity | /log | PASS | Transport and food activities logged successfully; recent activities updated |
| Insights | /insights | PASS | Recommendations regenerate after activity logging |
| Goals | /goals | PASS | Test Goal created without 422 and appears in list |
| Profile | /profile | PASS | Email/name/profile fields, achievements, save action, and delete button visible |

### Security

| Check | Status |
|---|---|
| HTTPS enforced | PASS |
| CORS restricted to allowed origins | PASS |
| Auth required on protected endpoints | PASS |
| Security headers present | PASS |
| CSP allows required Firebase, API, and consented analytics endpoints | PASS |

## Bugs Found and Fixed

| ID | Severity | Description | Files Changed | Fix Applied |
|---|---|---|---|---|
| BUG-1 | CRITICAL | Dashboard failed because /activities/summary returned 500 from a Firestore index mismatch. | backend/app/services/firestore_service.py | Added date ordering to match deployed activities(userId, date DESC) index. |
| BUG-2 | HIGH | Frontend expected camelCase while backend returned snake_case, causing blank read times and broken authenticated data rendering. | frontend/src/services/api.ts | Added API response/request mappers for activities, summaries, insights, goals, profiles, and education. |
| BUG-3 | HIGH | Backend health reported development, preventing HSTS from being sent. | Cloud Run env, backend/app/config.py | Deployed Cloud Run with ENVIRONMENT=production and corrected default project id. |
| BUG-4 | HIGH | Insights could remain stale after activity logging, so recommendations stayed empty. | backend/app/services/firestore_service.py | Invalidated cached insights after activity create/delete. |
| BUG-5 | MEDIUM | Required demo activity amounts did not trigger recommendations. | backend/app/services/recommendation_engine.py | Lowered car/beef recommendation thresholds to fire for any logged petrol/diesel car or beef activity. |
| BUG-6 | MEDIUM | Google Analytics collection requests produced CSP console errors. | frontend/index.html, frontend/src/firebase.ts | Added analytics hosts to connect-src and delayed analytics initialization until consent exists. |
| BUG-7 | LOW | Traversal-style education path returned 404 after URL normalization instead of the requested 400. | backend/main.py | Added API fallback that returns 400 for suspicious normalized API paths. |

## Verification Evidence

| Check | Result |
|---|---|
| Frontend TypeScript | PASS - npx tsc --noEmit |
| Frontend lint | PASS - npm run lint |
| Frontend build | PASS - npm run build |
| Backend focused tests | PASS - 51 passed, 1 warning |
| Cloud Run deploy | PASS - ecotrack-api-00004-kvz serving 100% traffic |
| Firebase Hosting deploy | PASS - Deploy complete |
| Final API smoke | PASS - health ok/production, education 5, calculate 4.8, protected endpoints 401 |
| Final browser flow | PASS - login, dashboard, activity data, insights, goals, profile, sign out, protected redirect |

## Known Limitations

- Article detail pages (/learn/slug) show 404 - detail view was out of scope.
- Privacy policy page shows 404 - static page not built.
- Rate limiting is per-instance as noted in the README.
- Google OAuth popup was verified; full Google account login was not completed because no Google credentials were provided. Disposable Firebase email/password auth was used for end-to-end protected flow verification.

## Test Coverage

- Backend: 199 tests, 98.33% coverage
- Frontend: 129 tests, 84.83% statement coverage

## Deployment Infrastructure

- Backend: Google Cloud Run (us-central1), ecotrack-api, 512Mi memory
- Frontend: Firebase Hosting (CDN), ecotrack-app-2026-1.web.app
- Database: Cloud Firestore (native mode, us-central1)
- Auth: Firebase Auth (Google OAuth + Email/Password)
- CI/CD: GitHub Actions (push to main triggers auto-deploy)
