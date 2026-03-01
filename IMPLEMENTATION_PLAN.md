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
9. Upgrades & IAM Hardening [EPIC] (id: epic-upgrades)
   9.1 Upgrade functions to Node 22 and firebase-functions v5+
   9.2 Prune temporary IAM to least privilege (id: upgrade-prune-iam)

## 2. Current Status
- DONE
  - Universal Header with user menu, profile edit (display name, avatar), sign out (id: header-universal)
  - Consent capture at signup and /consent settings page
  - sendEmail (Gen2) deployed; enforces consents; appends /consent link
  - Hosting target configured and deployed (Next.js prerender)
- IN_PROGRESS
  - Feed MVP (id: feed-mvp)
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
1) Implement predictionService + usePredictionFeed + indexes (feed-mvp)
2) Build Sidebar (Nav/DomainList) and wire filters (feed-mvp)
3) NewPredictionModal UI + validation + aiService client (create-modal)
4) Cloud Function: aiScore (func-aiscore)

## 7. Changelog
- v1 (2026-03-01): Initial plan created; current status and next actions recorded.
