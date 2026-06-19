# Deployment Guide

This guide covers the first-time infrastructure setup and the production
deployment path for EcoTrack.

## 1. Prerequisites

- Google Cloud CLI (`gcloud`)
- Firebase CLI (`firebase-tools`)
- Node.js 20 LTS
- Python 3.11
- A Google Cloud account with billing enabled
- Permission to create projects, service accounts, Firestore databases, Firebase
  apps, and GitHub repository secrets

## 2. Create the GCP Project

```bash
gcloud projects create ecotrack-app-2026 --name="EcoTrack"
gcloud config set project ecotrack-app-2026
```

Link the project to Firebase:

```bash
firebase projects:addfirebase ecotrack-app-2026
```

## 3. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  firebasehosting.googleapis.com \
  identitytoolkit.googleapis.com \
  iamcredentials.googleapis.com \
  artifactregistry.googleapis.com
```

These APIs support Cloud Run, Cloud Build, Firestore, Firebase Hosting, Firebase
Auth, service account authentication, and container image storage.

## 4. Create Firestore

Create a Firestore database in native mode and use `us-central1` as the region:

```bash
gcloud firestore databases create \
  --database="(default)" \
  --location=us-central1
```

Use production mode security rules. The repository includes `firestore.rules`
and `firestore.indexes.json`.

## 5. Enable Firebase Auth

In the Firebase console:

1. Open project `ecotrack-app-2026`.
2. Go to **Build > Authentication > Sign-in method**.
3. Enable **Email/Password**.
4. Enable **Google** and configure the public support email.
5. Add the Firebase Hosting domain and local development domain to authorized
   domains if they are not already present.

## 6. Configure Firebase Hosting

Initialize hosting from the repository root if it has not already been linked:

```bash
firebase login
firebase use ecotrack-app-2026
firebase init hosting
```

Use these answers:

| Prompt | Value |
|---|---|
| Public directory | `frontend/dist` |
| Configure as a single-page app | `Yes` |
| Set up automatic builds and deploys | `No` |
| Overwrite `firebase.json` | `No` |

The repository's `firebase.json` already configures SPA rewrites, cache headers,
security headers, Firestore rules, and Firestore indexes.

## 7. Create Deployment Service Accounts

Create a service account for GitHub Actions:

```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy"
```

Grant the roles needed by the workflows:

```bash
gcloud projects add-iam-policy-binding ecotrack-app-2026 \
  --member="serviceAccount:github-actions@ecotrack-app-2026.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ecotrack-app-2026 \
  --member="serviceAccount:github-actions@ecotrack-app-2026.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding ecotrack-app-2026 \
  --member="serviceAccount:github-actions@ecotrack-app-2026.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding ecotrack-app-2026 \
  --member="serviceAccount:github-actions@ecotrack-app-2026.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

Create a JSON key for the GitHub secret:

```bash
gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account=github-actions@ecotrack-app-2026.iam.gserviceaccount.com
```

For Firebase Hosting, create or download the Firebase service account JSON from
the Firebase console project settings.

## 8. Set GitHub Secrets

Add these secrets under **GitHub repository > Settings > Secrets and variables >
Actions**.

| Secret | Description |
|---|---|
| `GCP_PROJECT_ID` | Google Cloud project ID, usually `ecotrack-app-2026` |
| `GCP_SA_KEY` | JSON key for the GitHub Actions deploy service account |
| `GCP_HASH` | Cloud Run URL hash used by the workflow smoke-test URL |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Hosting deploy service account JSON |
| `VITE_API_BASE_URL` | Deployed API base URL ending in `/api/v1` |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |

`GITHUB_TOKEN` is provided automatically by GitHub Actions and does not need to
be created manually.

## 9. First Backend Deploy

The normal deployment path is a push to `main`, but the first backend deploy can
also be run manually to confirm Cloud Run permissions and obtain the service URL:

```bash
gcloud builds submit backend/ \
  --tag gcr.io/ecotrack-app-2026/ecotrack-api \
  --project ecotrack-app-2026

gcloud run deploy ecotrack-api \
  --image gcr.io/ecotrack-app-2026/ecotrack-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --max-instances 10 \
  --set-env-vars "ENVIRONMENT=production,GOOGLE_CLOUD_PROJECT=ecotrack-app-2026" \
  --project ecotrack-app-2026
```

After the URL is known, set `VITE_API_BASE_URL` to the Cloud Run API URL with
`/api/v1` appended.

## 10. First Frontend Deploy

Build locally once to verify the Firebase Hosting output:

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

After this, pushes to `main` should use the GitHub Actions deployment workflow.

## 11. Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore
```

This deploys both `firestore.rules` and `firestore.indexes.json`.

## 12. Run Seed Data

Authenticate with Application Default Credentials or set
`GOOGLE_APPLICATION_CREDENTIALS`, then run:

```bash
cd backend
GOOGLE_CLOUD_PROJECT=ecotrack-app-2026 python seed_data.py
```

The script writes the five education articles to the `education` collection and
uses `merge=True`, so it is safe to re-run.

## 13. Deploy Through CI/CD

Commit to `main` and push:

```bash
git push origin main
```

The deployment workflow runs backend tests, builds and deploys Cloud Run, runs
frontend linting, formatting, coverage, audit, and build checks, then deploys
Firebase Hosting to the live channel.

## 14. Verify Production

Smoke-test the deployed services:

```bash
curl -f https://ecotrack-api-[hash]-uc.a.run.app/api/v1/health
curl -I https://ecotrack-app-2026.web.app
```

Then open the app and verify:

1. The homepage loads from Firebase Hosting.
2. Sign-in works with Google and email/password.
3. The dashboard can fetch authenticated API data.
4. The Learn page shows all five seeded education articles.
5. Activity logging writes to Firestore and updates the dashboard summary.
