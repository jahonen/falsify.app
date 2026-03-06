# Services Documentation

## aiAnalyze (Cloud Function, Gen2)
- tag: beta
- description: Scores a draft prediction for Boldness and Relevance (1–100) using Vertex AI Gemini. Consumes BOLDNESS_RATING_GUIDE and RELEVANCE_RATING_GUIDE JSON from Secret Manager as calibration rubrics.

- interfaces
  - inputs
    - headers: Authorization: Bearer <Firebase ID token>
    - body: {
        summary: string,
        metrics: { metric: string; operator: '>' | '>=' | '<' | '<=' | '='; target: string }[1..3],
        rationale?: string,
        timeboxISO?: string,
        taxonomy?: { domain?: string; subcategory?: string; topic?: string }
      }
  - outputs
    - 200 JSON: { boldness: number (1–100), relevance: number (1–100), notes?: string[], fallbackUsed?: boolean }
    - 400 JSON: { error }
    - 401 JSON: { error }
    - 500 JSON: { error }
  - side_effects
    - Calls Vertex AI Gemini with strict JSON schema and system-instruction guides

- observability
  - logs: config (model/region, guides loaded), candidate finishReason, parts preview, retries, fallbackUsed flag

- dependencies
  - Vertex AI (Gemini), Secret Manager (guides), Firebase Auth (ID token verification)

## aiScore (Cloud Function, Gen2)
- tag: alpha
- description: Legacy plausibility/vagueness scorer. Retained for backwards compatibility and analysis; hardening in progress.

- interfaces
  - inputs
    - headers: Authorization: Bearer <Firebase ID token>
    - body: { summary, metric, operator, target, referenceValue?, timeboxISO?, taxonomy? }
  - outputs
    - 200 JSON: { plausibility: number (0–10), vaguenessFlag: boolean, notes: string[] }
  - side_effects
    - Calls Vertex AI Gemini with strict JSON schema

- observability
  - logs: candidate finishReason, parts preview, retry parsing

- dependencies
  - Vertex AI, Secret Manager (model/region)

## sendEmail (Cloud Function, Gen2)
- tag: stable
- description: Sends transactional emails to the signed-in user (consent-gated) via SendGrid.

- interfaces
  - inputs
    - headers: Authorization: Bearer <Firebase ID token>
    - body: { subject: string; text?: string; html?: string; category: 'own' | 'news' }
  - outputs
    - 200/204 text
  - side_effects
    - Sends email via SendGrid; appends consent management link

- observability
  - logs: delivery status and errors

- dependencies
  - SendGrid, Secret Manager (SENDGRID_API_KEY)

## aiConfig (Cloud Function, Gen2)
- tag: alpha
- description: Development helper to expose Gemini model/region when running emulator. Disabled in production.

- interfaces
  - inputs: GET
  - outputs: { model, region }
  - side_effects: none

- observability
  - logs minimal

- dependencies
  - Secret Manager (GEMINI_*), emulator guard


## vote-service (Client Service)
- tag: beta
- description: Casts a per-user vote on a prediction and transactionally updates aggregated counts on the prediction document.

- interfaces
  - inputs
    - predictionId: string
    - direction: 'up' | 'down'
    - user: { uid: string } (must be authenticated)
  - outputs
    - Promise<void> (resolves on success)
  - side_effects
    - Firestore transaction:
      - Creates/sets `predictions/{id}/votes/{uid}` with { direction, ts }
      - Updates `predictions/{id}.humanVotes` aggregate fields (up, down, total)

- observability
  - logs: start, end, and errors

- dependencies
  - Firebase Auth, Firestore

## notifyOnComment (Cloud Function, Gen2)
- tag: beta
- description: When a new comment is written to predictions/{predictionId}/comments, creates a notification under users/{authorId}/notifications.

- interfaces
  - inputs
    - Firestore event: onDocumentCreated("predictions/{predictionId}/comments/{commentId}")
  - outputs
    - Creates users/{authorId}/notifications/{autoId}: { type: 'comment', predictionId, commentId, fromUserId?, text, createdAt, read: false }
  - side_effects
    - Skips self-notifications (when commenter is the author)

- observability
  - logs: errors with function name and error message

- dependencies
  - Firebase Admin SDK (Firestore)

## updateReputationOnVoteWrite (Cloud Function, Gen2)
- tag: beta
- description: Adjusts the author's `users/{authorId}.reputation` on vote writes and maintains segmented aggregates `humanVotesPre`/`humanVotesPost` based on vote time vs `termReachedAt`.

- interfaces
  - inputs
    - Firestore trigger: onDocumentWritten("predictions/{predictionId}/votes/{voterId}")
  - outputs
    - Reputation: increments `users/{authorId}.reputation` by +1 for `calledIt`, -1 for `botched`, 0 for `fence` based on delta between before/after
    - Aggregates: updates `predictions/{id}.humanVotesPre.outcome.{calledIt,botched,fence}` and/or `humanVotesPost.outcome.{...}` using `vote.createdAt` < `termReachedAt` to classify phase
  - side_effects
    - Skips self-votes (author == voter)
    - Sets `updatedAt` on user doc and `predictions/{id}` when aggregates change

- observability
  - logs: info on deltas and phases (beforePhase/afterPhase); errors with context on failure

- dependencies
  - Firebase Admin SDK (Firestore)

## notifyPredictionTerm (Cloud Function, Gen2, Scheduled)
- tag: beta
- description: Periodic job that detects predictions whose timebox has reached/passed now, sets `termReachedAt` idempotently, and notifies authors once.

- interfaces
  - inputs
    - Scheduler: every 5 minutes (Etc/UTC)
    - Query: predictions where status == 'pending'; filters `timebox <= now` in code (avoid composite index)
  - outputs
    - Sets `predictions/{id}.termReachedAt` (if missing) and `updatedAt`
    - If not previously notified, creates `users/{authorId}/notifications/{autoId}`: { type: 'term', predictionId, createdAt, read: false } and sets `predictions/{id}.termNotified = true`
  - side_effects
    - Batches writes for efficiency; best-effort immediate email to author (consent-gated)

- observability
  - logs: start, fetched count, notified count, emailed count; errors with function name and error message

- dependencies
  - Firebase Admin SDK (Firestore), Cloud Scheduler (via functions v2)

## aiAssessDuePredictions (Cloud Function, Gen2, Scheduled)
- tag: beta
- description: Writes `aiResolution` suggestions for predictions that have reached term but are not yet resolved.

- interfaces
  - inputs
    - Scheduler: every 15 minutes (Etc/UTC)
    - Query: predictions where `status == 'pending'`
  - outputs
    - Writes `predictions/{id}.aiResolution = { suggestion: 'calledIt'|'botched'|'unknown', confidence: 0..100, metricResults?: [], notes?: [] }`
    - Does not change `status`
  - side_effects
    - Calls Vertex AI Gemini with strict JSON schema and bounded backoff

- observability
  - logs: start/end, checked/assessed counts, per-item suggestion/confidence; errors with context

- dependencies
  - Vertex AI (Gemini), Secret Manager (GEMINI_*), Firebase Admin SDK (Firestore)

## autoResolveDuePredictions (Cloud Function, Gen2, Scheduled)
- tag: beta
- description: After a grace period from `termReachedAt`, auto-resolves pending predictions using post-term vote consensus, else marks as `disputed`.

- interfaces
  - inputs
    - Scheduler: every 30 minutes (Etc/UTC)
    - Env: `RESOLUTION_GRACE_DAYS` (default 3), `RESOLUTION_MIN_POST_VOTES` (default 5), `RESOLUTION_MIN_POST_SHARE` (default 0.6)
  - outputs
    - If consensus: sets `outcome`, `resolutionSource: 'auto-consensus'`, `status: 'resolved'`, `resolvedAt` and `updatedAt`
    - Else: sets `status: 'disputed'` and `updatedAt`
  - side_effects
    - Writes to prediction doc; no emails (author/UI surface handles visibility)

- observability
  - logs: start/end, thresholds, checked/resolved/disputed counts; errors with context

- dependencies
  - Firebase Admin SDK (Firestore), Cloud Scheduler (via functions v2)

## prediction-service (Client Service)
- tag: beta
- description: Client-side functions for predictions CRUD and lifecycle actions.

- interfaces
  - inputs/outputs
    - getPredictionById(id: string) => Promise<Prediction | null>
    - listPredictions(params?: FeedParams) => Promise<{ items: Prediction[]; nextCursor: DocumentData | null }>
    - acceptAiSuggestion(predictionId: string) => Promise<void>
      - side_effects: writes `authorResolution`, sets `outcome`, `status: 'resolved'`, `resolutionSource: 'author'`, timestamps
    - setOutcome(predictionId: string, outcome: 'calledIt'|'botched'|'fence', rationale?, evidenceUrl?) => Promise<void>
      - side_effects: writes `authorResolution` with rationale/evidence, sets `outcome`, `status: 'resolved'`, `resolutionSource: 'author'`, timestamps

- observability
  - client-surface errors through UI toasts; no server logs

- dependencies
  - Firebase Auth, Firestore

## follow-service (Client Service)
- tag: alpha
- description: Manages the follow graph using subcollections at `users/{uid}/following/{targetUid}`.

- interfaces
  - inputs
    - followUser(targetUid: string) => Promise<void>
    - unfollowUser(targetUid: string) => Promise<void>
    - isFollowing(targetUid: string) => Promise<boolean>
    - listFollowers(targetUid: string, max?: number) => Promise<string[]>
    - listFollowing(uid: string, max?: number) => Promise<string[]>
  - outputs
    - As above
  - side_effects
    - Writes `users/{uid}/following/{targetUid}` with { followedId, createdAt }
    - Deletes the same on unfollow
    - Reads via collection group queries for followers

- observability
  - client-surface errors through UI toasts; no server logs

- dependencies
  - Firebase Auth, Firestore

## onFollowCreated / onFollowDeleted (Cloud Functions, Gen2)
- tag: alpha
- description: Maintain derived counters on user docs when follow docs are created/deleted.

- interfaces
  - inputs
    - onFollowCreated: onDocumentCreated("users/{userId}/following/{targetId}")
    - onFollowDeleted: onDocumentDeleted("users/{userId}/following/{targetId}")
  - outputs
    - Updates `users/{userId}.followingCount` (+/-1)
    - Updates `users/{targetId}.followersCount` (+/-1)
  - side_effects
    - Batches counter updates and sets `updatedAt`

- observability
  - logs: info on updates, errors on failures

- dependencies
  - Firebase Admin SDK (Firestore)

## Third-party dependencies
- react-hot-toast
  - version: 2.4.1 (locked)
  - usage: client-side toasts for user feedback (votes, comments, DMs, profile saves)

- recharts
  - version: 2.12.7 (locked)
  - usage: client-only chart rendering for Prediction details' Forecast Convergence (`ConvergenceChart`).
  - notes: imported in a client component only; no server-side usage.

### Dev/Test dependencies
- jest
  - version: 29.7.0 (locked)
  - usage: unit and component testing framework for web and functions

- ts-jest
  - version: 29.2.4 (locked)
  - usage: TypeScript transformer for Jest

- @types/jest
  - version: 29.5.12 (locked)
  - usage: TypeScript typings for Jest globals

- @testing-library/react
  - version: 14.2.1 (locked)
  - usage: React component testing utilities

- @testing-library/jest-dom
  - version: 6.3.0 (locked)
  - usage: Custom DOM matchers for Jest

- @testing-library/user-event
  - version: 14.5.2 (locked)
  - usage: Higher-level user interaction simulation in component tests


## activity-service (Client Service)
- tag: alpha
- description: Lists a user's recent predictions, votes, and comments for profile Activity.

- interfaces
  - inputs
    - listUserPredictions(uid: string, limit?: number)
    - listUserVotes(uid: string, limit?: number)
    - listUserComments(uid: string, limit?: number)
  - outputs
    - Promise<UserPredictionActivity[]>
    - Promise<UserVoteActivity[]>
    - Promise<UserCommentActivity[]>
  - side_effects
    - Firestore queries: `predictions` (authorId == uid), collectionGroup `votes` (userId == uid), collectionGroup `comments` (userId == uid)

- observability
  - logs: minimal in client (surfaced via UI states)

- dependencies
  - Firestore


## dm-service (Client Service)
- tag: alpha
- description: Provides 1:1 direct messages between two users via threads and messages subcollections.

- interfaces
  - inputs
    - createOrGetThread(otherUid: string) => Promise<string>
    - sendMessage(threadId: string, text: string) => Promise<void>
    - listMessages(threadId: string, max?: number) => Promise<DMMessage[]>
    - listThreadsForSelf(max?: number) => Promise<DMThread[]>
  - outputs
    - as above
  - side_effects
    - Reads/writes `dms/{threadId}` and `dms/{threadId}/messages`

- observability
  - logs: minimal in client (surfaced via UI states)

- dependencies
  - Firebase Auth, Firestore

## profile-service (Client Service)
- tag: alpha
- description: Reads and upserts the signed-in user's profile document.

- interfaces
  - inputs
    - getUserProfile(uid: string)
    - upsertOwnProfile(partial: { displayName?, bio?, photoURL? })
  - outputs
    - Promise<UserProfile | null> for get
    - Promise<void> for upsert
  - side_effects
    - Reads/writes `users/{uid}`; sets createdAt/updatedAt server timestamps

- observability
  - logs: minimal in client (surfaced via UI states)

- dependencies
  - Firebase Auth, Firestore

## discussion-service (Client Service)
- tag: beta
- description: Appends a new comment to a prediction's `comments` array.

- interfaces
  - inputs
    - predictionId: string
    - text: string
    - user: { uid: string; displayName?: string; photoURL?: string }
  - outputs
    - Promise<string> (commentId)
  - side_effects
    - Firestore update using `arrayUnion` to add a comment object with metadata

- observability
  - logs: start, end, and errors

- dependencies
  - Firebase Auth, Firestore

