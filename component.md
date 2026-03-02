# Components Documentation

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
- description: Displays a prediction with multi-metrics, rationale, and AI analysis chips.

- interfaces
  - inputs
    - prediction: Prediction (includes optional `metrics`, `rationale`, `aiAnalysis`)
  - outputs
    - none (presentational)
  - side_effects
    - none

- observability
  - analytics: may emit view/interact events (clicks, expands)

