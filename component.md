# Components Documentation

## ProfilePage
- tag: alpha
- description: Public user profile page at `/u/[uid]` showing avatar, display name, and bio. Owner can open edit modal.

- interfaces
  - inputs
    - uid: string
  - outputs
    - none
  - side_effects
    - Reads `users/{uid}` from Firestore

- observability
  - analytics: profile_view


## EditProfileModal
- tag: alpha
- description: Modal to edit own profile fields: displayName, bio, avatar.

- interfaces
  - inputs
    - onClose: () => void
    - onSaved: () => void
  - outputs
    - none
  - side_effects
    - Calls `profile-service.upsertOwnProfile`

- observability
  - analytics: profile_edit_open/profile_edit_save/profile_edit_error


## AvatarUploader
- tag: alpha
- description: Uploads avatar image to Firebase Storage and returns a URL to save in profile.

- interfaces
  - inputs
    - onUploaded: (url: string) => void
  - outputs
    - none
  - side_effects
    - Writes to Storage at `avatars/{uid}.{ext}`; reads a download URL

- observability
  - analytics: avatar_upload_start/success/error

## NewPredictionModal
- tag: beta
- description: Modal for creating predictions with 1–3 metrics, optional rationale, and two-step Propose/Submit flow.

- interfaces
  - inputs
    - summary: string (required)
    - metrics: Metric[] (1–3) where Metric = { metric: string; operator: '>' | '>=' | '<' | '<=' | '='; target: string }
    - rationale: string (optional)
    - timebox: string (ISO or human-readable) (required)
    - taxonomy: { domain?: string; subcategory?: string; topic?: string }
  - outputs
    - onPropose: triggers AI analysis and renders { boldness: number; relevance: number; notes?: string[] }
    - onSubmit: persists Prediction document including metrics, rationale, aiAnalysis
  - side_effects
    - Calls Cloud Function `aiAnalyze` (authenticated)
    - Writes prediction to Firestore via `prediction-service`

- observability
  - analytics: emits events on propose_attempt/success/failure and submit_success/failure

- styling
  - Uses shared `src/styles/main.scss`
  - Component-specific styles co-located if needed

## PredictionCard
- tag: beta
- description: Displays a prediction with multi-metrics, rationale, AI analysis chips, and VoteButtons. Clicking opens expanded modal.

- interfaces
  - inputs
    - prediction: Prediction (includes optional `metrics`, `rationale`, `aiAnalysis`)
  - outputs
    - onOpen: () => void
  - side_effects
    - Calls `vote-service.castVote` on VoteButtons interaction

- observability
  - analytics: may emit view/interact events (clicks, expands)


## PredictionModal
- tag: beta
- description: Expanded view of a prediction in a modal opened from the feed card. Presents full metrics, rationale, AI analysis, timeline, verdict bar, and a basic discussion section with add comment.

- interfaces
  - inputs
    - prediction: Prediction (includes optional `metrics`, `rationale`, `aiAnalysis`, `humanVotes`, `comments`)
    - onClose: () => void
  - outputs
    - onCommentAdded?: (commentId) => void
  - side_effects
    - Calls `discussion-service.addComment` to append a new comment

- observability
  - analytics: optional events on open/close and discussion expand


## Header
- tag: stable
- description: Top navigation with search input synced to URL `?q`.

- interfaces
  - inputs
    - initialQuery?: string (from current URL)
  - outputs
    - onSearchChange: pushes/replaces router with updated `?q`
  - side_effects
    - Updates URL search params; emits analytics on search_submit

- observability
  - analytics: emits search_input and search_submit events


## AboutPage
- tag: stable
- description: Static About page linked in footer with mission and dedication.

- interfaces
  - inputs
    - none
  - outputs
    - none
  - side_effects
    - none

## UserProfileModal
- tag: alpha
- description: Reusable modal that displays a user's profile (avatar, name, bio) and lets you start a 1:1 DM thread.

- interfaces
  - inputs
    - uid: string
    - open: boolean
    - onClose: () => void
  - outputs
    - none
  - side_effects
    - Reads `users/{uid}` from Firestore
    - Reads/writes `dms/{threadId}` and `dms/{threadId}/messages` via `dm-service`

- observability
  - analytics: user_profile_modal_open/user_profile_modal_message_send

