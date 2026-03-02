# Falsify

Falsify is a web app for making and reviewing falsifiable predictions. It includes a Next.js frontend and Firebase backend with Cloud Functions (Gen2), Firestore, Auth, Storage, and Hosting.

- Live Hosting: https://falsify-app.web.app
- Functions (example): `sendEmail` (Gen2) [requires Firebase ID token]

## Current epic: Prediction Modal + AI Analysis
- NewPredictionModal: supports 1–3 metrics, `rationale`, and a two-step flow.
  - Propose → runs `aiAnalyze` (Cloud Function) to score Boldness/Relevance (1–100).
  - Submit → enabled only after a successful Propose for the current inputs.
  - Modal cannot be closed by overlay/Escape; only by the X button.
- PredictionCard: shows all metrics, rationale, and Boldness/Relevance chips.

## Recent additions
- Search v1: front page respects `?q` and filters client-side by summary, rationale, and metrics.
- Expanded Prediction modal: clicking a card opens a modal with full details (metrics, rationale, AI analysis, timeline, verdict, basic discussion section).

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
Prerequisites: Node 20+, npm, Firebase CLI, gcloud SDK.

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
- Hosting (Next.js Web Frameworks integration)
```
firebase deploy --only hosting
```
- Functions (predeploy builds TypeScript automatically)
```
firebase deploy --only functions:aiAnalyze
firebase deploy --only functions:aiScore
firebase deploy --only functions:sendEmail
```

## Secrets & configuration
- Secret Manager (project: falsify-app)
  - `SENDGRID_API_KEY`
  - `GEMINI_MODEL_NAME`, `GEMINI_REGION`
  - `BOLDNESS_RATING_GUIDE`, `RELEVANCE_RATING_GUIDE` (JSON rubrics consumed by `aiAnalyze`)
- IAM is configured so Functions runtime and Cloud Build can access required services.

## Security rules (summary)
- Firestore:
  - Create/update/delete predictions and create comments require verified email.
  - Users can update their own profile docs.
  - Votes: create only; updates/deletes disabled.
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
