# Falsify

Falsify is a web app for making and reviewing falsifiable predictions. It includes a Next.js frontend and Firebase backend with Cloud Functions (Gen2), Firestore, Auth, Storage, and Hosting.

- Live Hosting: https://falsify-app.web.app
- Functions (example): `sendEmail` (Gen2) [requires Firebase ID token]

## Current epic: Profiles & Reputation
- Profiles v1: public profile at `/u/[uid]` and self-edit modal (displayName, bio, avatar).
- Activity: surface user predictions/votes/comments over time (next).
- Reputation: simple score and badges; leaderboards (next).

## Recent additions
- Search v1: `?q` synced from header search and client-side filtering on summary, rationale, metrics.
- Expanded Prediction modal: full details + basic discussion section.
- About page linked in footer with mission and dedication.
- SEO basics: `sitemap.xml`, `robots.txt`, and `public/llms.txt`.
- Next.js fix: `useSearchParams()` usage wrapped in a Suspense boundary on `/`.

## Tech stack
- Next.js 14 + React 18
- Firebase: Auth, Firestore, Storage, Hosting, Emulator Suite
- Cloud Functions (Gen2) with Secret Manager (SendGrid, Gemini)
- TypeScript, Tailwind/SCSS

## Repository layout
- `/app`, `/src` — Next.js app
- `/functions` — Cloud Functions (Gen2, TypeScript)
- `IMPLEMENTATION_PLAN.md` — living plan (epics, tasks, status)
- `LICENSE` — MIT

## Getting started (local)
Prerequisites: Node 20 (LTS), npm, Firebase CLI, gcloud SDK.

1) Install dependencies
```
npm install
(cd functions && npm install)
```

2) Configure environment
- Copy `.env.local.example` to `.env.local` and fill Firebase config.
- By default, this project develops against production (`NEXT_PUBLIC_USE_EMULATORS=false`).

3) Run dev server
```
npm run dev
```
Open http://localhost:3000

## Deploy
- Hosting (Next.js Web Frameworks integration creates a Cloud Function for SSR/Image Optimization)
```
firebase deploy --only hosting
```
- Functions (predeploy builds TypeScript automatically)
```
firebase deploy --only functions:aiAnalyze
firebase deploy --only functions:aiScore
firebase deploy --only functions:sendEmail
```

Notes:
- Node.js 20 is required for local tooling and Cloud Functions runtime. Newer Node versions may fail the framework integration.
- The Hosting integration deploys an auto-managed function (e.g., `ssrfalsifyapp`) for Next.js. Project IAM may need `roles/functions.admin` to set invoker on first deploy.

## Secrets & configuration
- Secret Manager (project: falsify-app)
  - `SENDGRID_API_KEY`
  - `GEMINI_MODEL_NAME`, `GEMINI_REGION`
  - `BOLDNESS_RATING_GUIDE`, `RELEVANCE_RATING_GUIDE` (JSON rubrics consumed by `aiAnalyze`)
- IAM is configured so Functions runtime and Cloud Build can access required services.

## Security rules (summary)
- Firestore:
  - Predictions: create/update/delete require verified email.
  - Comments: append-only to `prediction.comments` for verified users.
  - Votes: per-user vote docs in `predictions/{id}/votes` (create-only). Aggregated counts updated transactionally.
  - Users can update their own profile docs.
- Storage:
  - Avatars stored under `avatars/{uid}.{ext}`; download links via `getDownloadURL`.

## Implementation plan
See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for milestones (epics), tasks, stories, and live status.

## Verifying AI analysis (Propose/Submit)
1. Open New Prediction modal and fill summary, 1–3 metrics, timebox, and optional rationale.
2. Click Propose. Expect Boldness/Relevance (1–100) and optional notes to appear.
3. Change any input (including timebox) → Propose is required again; Submit is gated until Propose succeeds.
4. Cards render metrics, rationale, and B/R chips after publishing.

## License
MIT — see [LICENSE](./LICENSE).

## Contributing
Issues and PRs are welcome. Please avoid committing secrets; `.env.local` and emulator/data artifacts are gitignored.
