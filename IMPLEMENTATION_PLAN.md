# Falsify Implementation Plan (Living Document)

Status legend: DONE, IN_PROGRESS, PENDING, DEFERRED
Owner: Cascade (updates continuously as work progresses)

## 1. Milestones (Epics)
1. Core Feed & Navigation [EPIC] (id: epic-feed)
   1.1 Feed MVP: predictionService + usePredictionFeed + Pagination + Sidebar (Nav/DomainList) + Indexes (id: feed-mvp)
   1.2 Sidebar: Nav groups, domain filters with counts
2. Prediction Creation & AI [EPIC] (id: epic-create-ai)
   2.1 NewPredictionModal: form validation, CategorySelect, operator/timebox, drafts + publish, aiService wiring (id: create-modal)
   2.2 Cloud Function aiScore (GEMINI secrets) with input/output contracts (id: func-aiscore)
3. Voting & Aggregation [EPIC] (id: epic-votes)
   3.1 voteService + one-vote-per-user enforcement (rules + structure)
   3.2 onVoteWrite aggregator updates prediction.counts (id: votes-impl)
4. Leaderboard, Trending, Domain Stats [EPIC] (id: epic-agg)
   4.1 Scheduled jobs: trending, leaderboards, domain counts (id: agg-jobs-ui)
   4.2 Right panel components: leaderboard, trending, stats
5. Search & Watchlist [EPIC] (id: epic-search-watch)
   5.1 Topbar search (client filter MVP)
   5.2 Watchlist add/remove and view (id: search-watch-mvp)
6. Security Rules & Indexes Hardening [EPIC] (id: epic-rules-indexes)
   6.1 Tighten Storage rules for avatars/{uid}.* (id: rules-indexes-task)
   6.2 Finalize Firestore composite indexes
7. Docs, Interfaces, Tests, Lifecycle Tags [EPIC] (id: epic-quality)
   7.1 component.md & services.md docs; interface docs (inputs/outputs/side_effects) (id: docs-interfaces)
   7.2 Tests: date-utils unit; PredictionCard snapshot; service unit tests (id: tests-init)
8. Hosting/Deploy & Observability [EPIC] (id: epic-deploy-obs)
   8.1 Link Hosting site; analytics events (consent-gated) (id: deploy-analytics)
   8.2 Add Open Graph and Twitter metadata (title, description, image) for rich previews (id: seo-metadata)
9. Upgrades & IAM Hardening [EPIC] (id: epic-upgrades)
   9.1 Upgrade functions to Node 22 and firebase-functions v5+
   9.2 Prune temporary IAM to least privilege (id: upgrade-prune-iam)

## 2. Current Status
- DONE
  - Universal Header with user menu, profile edit (display name, avatar), sign out (id: header-universal)
  - Consent capture at signup and /consent settings page
  - sendEmail (Gen2) deployed; enforces consents; appends /consent link
  - Hosting target configured and deployed (Next.js prerender)
  - Search v1: `?q` filters feed client-side by summary, rationale, metrics (id: search-v1)
  - Expanded Prediction modal on card click with Discussion section (id: modal-expand)
- IN_PROGRESS
  - Feed MVP (id: feed-mvp)
    - Completed: predictionService, usePredictionFeed hook, integration on home page, Load more
    - Remaining: Sidebar components (Nav/DomainList), composite indexes for domain + createdAt
- PENDING
  - create-modal, func-aiscore, votes-impl, agg-jobs-ui, search-watch-mvp
  - rules-indexes-task, docs-interfaces, tests-init, deploy-analytics, upgrade-prune-iam

## 3. Tasks & Stories (with interfaces)
- predictionService (F-1)
  - Inputs: { tab, filters, cursor }
  - Outputs: { predictions[], nextCursor }
  - Side effects: none
- usePredictionFeed (F-2)
  - Inputs: service + params
  - Outputs: state + fetchMore
- Sidebar (F-3)
  - Components: NavGroup, NavItem, DomainList
- NewPredictionModal (C-1)
  - Validates summary/metric/operator/target/timebox/taxonomy
  - Draft save, publish (verified email)
- aiService (C-2)
  - score({ summary, metric, operator, target, referenceValue, timebox, taxonomy }) -> { score, vaguenessFlag, notes }
- Cloud Function aiScore (C-3)
  - Secrets: GEMINI_MODEL_NAME, GEMINI_REGION
- voteService (V-1)
  - castVote(predictionId, type) idempotent by (predictionId,userId)
- onVoteWrite (V-2)
  - Aggregates to prediction.counts
- Aggregates & Right Panel (A-1/A-2)
  - scheduledTrending, scheduledLeaderboards, domain counts; UI lists
- Search & Watchlist (S-1/S-2)
  - Client search MVP; watchlist add/remove; view
- Rules/Indexes (R-1/R-2)
  - Storage: restrict avatars/{uid}.* writes to uid
  - Composite indexes for feed queries
- Docs/Tests (Q-1/Q-2)
  - component.md, services.md; unit + snapshot tests
- Deploy/Analytics (D-1)
  - Link Hosting to Web app; add consent-gated analytics
- SEO Metadata (D-2 / seo-metadata)
  - Add Open Graph and Twitter fields (title, description, image) for better link previews
- Upgrades/IAM (U-1/U-2)
  - Node 22 + functions v5+; prune IAM to least privilege

## 4. Risks & Mitigations
- Index coverage for feed queries: pre-create required indexes.
- Voting idempotency: enforce via structure + rules + server aggregation.
- AI function latency: debounce and cache recent results client-side.
- Storage access: tighten rules before broader avatar usage.

## 5. Acceptance Criteria (selected)
- Feed MVP: paginated with filters; index-backed; consistent ordering.
- Create & AI: modal validation; AI score in ~1–2s; publish gated by verified email.
- Voting: single vote/user/prediction; counts reflect within ~1s.
- Aggregates: leaderboard/trending/domain counts update on schedule.
- Search/Watchlist: basic search; add/remove watchlist; dedicated view.
- Rules/Indexes: Storage + composite indexes enforced; no console rule errors.
- Docs/Tests: minimal tests pass; docs present; lifecycle tags applied.

## 6. Next Actions (short-term)
1) Build Sidebar (Nav/DomainList) and wire filters (feed-mvp)
2) Add composite index for predictions: taxonomy.domain asc + createdAt desc (feed-mvp)
3) Search UX polish: debounce header input; add clear button (search-v1-followup)
4) Optional: Deep-link expanded card via `?pred=<id>` (modal-expand-followup)
5) Add Open Graph and Twitter metadata (seo-metadata)

## 7. Changelog
- v1 (2026-03-01): Initial plan created; current status and next actions recorded.
- v2 (2026-03-01): Started Feed MVP; added predictionService, usePredictionFeed, and home integration with pagination.
- v3 (2026-03-02): Implemented Search v1 (?q client filter) and expanded Prediction modal; updated README and docs.

## 8. SEO – Dynamic Sitemaps for Predictions [DEFERRED]
- Scope: Improve index coverage of individual predictions by exposing them via sitemaps.
- Structure:
  - /sitemap.xml (index) -> static pages + /sitemap/predictions.xml
  - /sitemap/predictions.xml -> lists monthly sub-sitemaps (e.g., /sitemap/predictions/2026-03.xml)
  - /sitemap/predictions/YYYY-MM.xml -> URLs for public predictions in that month
- Implementation sketch:
  - Next route handlers under app/sitemap*.xml with server-side Firestore reads and strong caching.
  - Cache-Control: public, max-age=3600, s-maxage=86400.
  - Firestore filters: visibility public, status in [pending,resolved]. lastmod = max(updatedAt, timebox, resolvedAt, createdAt fallback).
  - Add robots route (app/robots.ts) with Sitemap: https://falsify.app/sitemap.xml
- Indexes: add composite indexes for status + updatedAt (and/or createdAt by month).
- Acceptance: Google Search Console fetches sitemap index; monthly files under 50k URLs; URLs resolve to /p/{id}.

## 9. Prediction Lifecycle v1 [BETA]
- Goal: Separate AI assessment, Author resolution, and Community votes; segment votes/comments into pre-term and post-term for clarity and fairness.

- Data model (additions)
  - termReachedAt: Timestamp (set when timebox passes; idempotent)
  - aiResolution: {
    - suggestion: calledIt | botched | unknown
    - confidence: number (0–100)
    - metricResults: Array<{ metric, operator, target, assessment: met | unmet | unknown; confidence?: number; evidenceUrl?: string }>
    - notes?: string[]
  }
  - authorResolution: {
    - outcome: calledIt | botched | fence
    - rationale?: string
    - evidenceUrl?: string
    - decidedBy: string (uid)
    - decidedAt: Timestamp
  }
  - outcome: calledIt | botched | fence (final)
  - resolutionSource: author | auto-consensus | moderation
  - Votes (segmented aggregates):
    - humanVotesPre: { outcome: { calledIt, botched, fence }, quality: { high, low } }
    - humanVotesPost: { outcome: { calledIt, botched, fence }, quality: { high, low } }
    - Each vote doc keeps createdAt; phase derived at write (createdAt < termReachedAt ? pre : post)

- Services / Functions (interfaces; inputs/outputs/side_effects)
  - notifyPredictionTerm [extend]
    - Inputs: scheduled
    - Outputs: set termReachedAt (if due); ensure termNotified + user notification
    - Side effects: writes prediction + notification docs; sends email
  - aiAssessDuePredictions [new scheduled]
    - Inputs: scheduled
    - Outputs: writes aiResolution (suggestion, confidence, metricResults, notes)
    - Side effects: Vertex AI call; no status change
  - acceptAiSuggestion(predictionId) [client]
    - Inputs: { predictionId }
    - Outputs: authorResolution, outcome, resolvedAt, resolutionSource: author, status: resolved
    - Side effects: writes prediction; analytics event
  - setOutcome(predictionId, outcome, rationale?, evidenceUrl?) [client]
    - Inputs: { predictionId, outcome, optional rationale/evidenceUrl }
    - Outputs: authorResolution (manual), resolvedAt, resolutionSource: author, status: resolved
    - Side effects: writes prediction; analytics event
  - updateReputationOnVoteWrite [extend]
    - Inputs: Firestore onWrite for predictions/{id}/votes/{uid}
    - Outputs: maintain humanVotesPre and humanVotesPost based on vote.createdAt vs termReachedAt; keep reputation delta
    - Side effects: updates prediction aggregates; user reputation increments remain
  - autoResolveDuePredictions [new scheduled]
    - Inputs: scheduled; after gracePeriodDays from termReachedAt
    - Outputs: if clear consensus in post-term votes, set outcome/resolvedAt/status resolved with resolutionSource: auto-consensus; else status: disputed
    - Side effects: writes prediction; logs summary

- UI/UX
  - /p/[id] banner after termReachedAt: shows AI suggestion (confidence, per-metric results) and actions: Accept, Override
  - Discussion divider: visually separates comments before vs after termReachedAt with a labelled border (e.g., "After deadline")


- Observability & Analytics
  - Log start/end/counts/errors in jobs; include reasons for skips
  - Events: ai_resolution_suggested, resolution_accepted, resolution_overridden, auto_resolved, resolution_disputed

- Security/Rules
  - Authors (or moderators) can set outcome during grace window
  - Scheduled function can set outcome post-grace under consensus rules

- Testing
  - Unit: lifecycle transitions (termReachedAt; grace window), AI suggestion write, vote phase aggregation, consensus thresholds
  - Contract: aiAssessDuePredictions output shape; autoResolveDuePredictions paths (resolved/disputed)

- Acceptance Criteria
  - On term, termReachedAt set and notification sent
  - AI suggestion present without altering status
  - Author can accept/override; status becomes resolved with proper source
  - Post-grace, clear consensus auto-resolves; otherwise marked disputed
  - UI shows pre/post-term vote counts and a comments divider
