# ML Service Architecture (FastAPI + scikit-learn)

## 1. Service Role
The ML service provides specialized scoring endpoints for fraud/trust adjudication. It is intentionally isolated from backend business routing so model behavior can evolve independently.

Main file: `ml-service/main.py`

## 2. API Surface

### Health
- `GET /`
- `GET /api/models/status`

### Pillar endpoints
- `POST /api/pillar1/behavioral-auth`
- `POST /api/pillar2/environmental-consensus`
- `POST /api/pillar3/session-authenticity`
- `POST /api/pillar4/ring-detect`
- `POST /api/score/aggregate`

## 3. Four Pillars Explained

### Pillar 1: Behavioral Authentication
Input:
- list of heartbeat timestamps.

Feature extraction:
- interval gaps between heartbeats.
- average gap.
- timing jitter (stddev).

Model:
- IsolationForest anomaly model.

Output:
- `score` (human-likeness), `isBot`, jitter, confidence string.

Intent:
- Distinguish natural human timing noise from script-like precision.

### Pillar 2: Environmental Consensus
Input:
- city.

External data:
- Open-Meteo geocoding + weather.
- NewsAPI event mentions.
- AQICN air quality.

Model:
- GradientBoostingRegressor returns disruption score.

Output:
- disruption score, evidence lines, raw evidence payload.

Intent:
- Confirm real world disruption with multiple evidence channels.

### Pillar 3: Session Authenticity
Input:
- session start, registered/observed city, heartbeats.

Features:
- recency in minutes.
- ip-city match proxy.
- chain-valid proxy (at least minimum heartbeats).
- active/heartbeat count.

Model:
- GradientBoostingClassifier (`predict_proba`).

Output:
- chain/ip/recency signals plus authenticity score.

Intent:
- Estimate whether session reflects real, recent, and coherent work behavior.

### Pillar 4: Ring Detection
Input:
- cluster of claims with user/timestamp/ip/workproof.

Features:
- subnet diversity.
- timestamp entropy.
- workproof variance.
- cluster size.

Model:
- LogisticRegression classifier.

Output:
- `ringRisk`, suspicious cluster boolean, feature diagnostics.

Intent:
- Detect coordinated claim rings/collusion behavior.

## 4. Aggregation Endpoint
`/api/score/aggregate` computes final trust/fraud using weighted blend from `scoring.py`:
- pillar1 0.25
- pillar2 0.30
- pillar3 0.30
- pillar4 0.15 (inverse risk)

Returns:
- `trustScore`
- `fraudScore = 1 - trustScore`
- decision (`PAID` if trust >= 0.65 else `REVIEW`)

## 5. Model Hub Design
File: `ml-service/model_hub.py`

### Boot behavior
At import time, `model_hub = ModelHub()`:
- Ensures model directory exists.
- If files are missing, trains synthetic models.
- Loads models from disk via joblib.

### Model files
- `risk_model.pkl`
- `work_proof_model.pkl`
- `fraud_model.pkl`
- `ring_detector.pt` (joblib logistic model despite extension)

### Predict methods
- `predict_environment_risk`
- `predict_work_proof`
- `predict_fraud_anomaly`
- `predict_ring_probability`

## 6. Synthetic Training Strategy
The service currently trains on synthetic generated data if model files are absent.
This is excellent for demo portability but should be replaced by:
- real labeled datasets
- reproducible training pipeline
- versioned model registry
- offline validation metrics

## 7. External Dependencies
From `requirements.txt`:
- fastapi, uvicorn, pydantic
- requests
- numpy
- scikit-learn
- joblib

## 8. Service Characteristics
Strengths:
- Clear pillar decomposition.
- Portable startup (self-healing model generation).
- Useful fallback compatibility with backend.

Risks:
- External API availability affects pillar 2 fidelity.
- Model quality is bound by synthetic data assumptions.
- One model file uses `.pt` extension although loaded via joblib, which can confuse maintainers.

## 9. Suggested Evolution
- Add model metadata endpoint with version/metrics.
- Add per-pillar calibration and confidence intervals.
- Add structured error response for partial evidence failure.
- Add unit tests for feature engineering functions.
- Add batch scoring endpoint for admin analytics.
