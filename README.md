# Falsify

Falsify is a web app for making and reviewing falsifiable predictions. It includes a Next.js frontend and Firebase backend with Cloud Functions (Gen2), Firestore, Auth, Storage, and Hosting.

- Live Hosting: https://falsify-app.web.app
- Functions (example): `sendEmail` (Gen2) [requires Firebase ID token]

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
firebase deploy --only functions:sendEmail
```

## Secrets & configuration
- Secret Manager (project: falsify-app)
  - `SENDGRID_API_KEY`
  - `GEMINI_MODEL_NAME`, `GEMINI_REGION`
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

## License
MIT — see [LICENSE](./LICENSE).

## Contributing
Issues and PRs are welcome. Please avoid committing secrets; `.env.local` and emulator/data artifacts are gitignored.
