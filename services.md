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

