# System Architecture

## 1. Architectural Style
KavachPay uses a three-service architecture:
- Frontend SPA (React/Vite) for user and admin interfaces.
- Backend API (Express/TypeScript) as the orchestration and business-logic layer.
- ML scoring service (FastAPI/Python) as a specialized risk-evaluation engine.

Backend is the source of truth for claims, policy state, and treasury accounting. ML service is advisory/scoring, with backend fallbacks when ML is unavailable.

## 2. End-to-End Diagram

```text
[ Browser SPA ]
     |
     | HTTPS/HTTP JSON APIs
     v
[ Express Backend ] ----------------------> [ External APIs ]
     |                                        - Open-Meteo (geocoding/weather)
     |                                        - NewsAPI
     |                                        - AQICN
     |                                        - Brevo SMTP API
     |                                        - Razorpay (payments/payouts)
     |
     | Prisma ORM
     v
[ PostgreSQL ]
     |
     | Internal HTTP (ML_SERVICE_URL)
     v
[ FastAPI ML Service ]
     |
     v
[ ML Models on disk: pkl/pt ]
```

## 3. Responsibility Boundaries

### Frontend owns
- User experience and route navigation.
- Capturing user actions and input data.
- Session heartbeat triggering through API calls.
- Rendering claim/policy/admin state returned by backend.

### Backend owns
- Authentication/authorization.
- Policy and claim lifecycle.
- Session hash-chain generation and validation.
- Treasury ledger integrity.
- Calling ML service and applying fallback logic.

### ML service owns
- Pillar-based predictive scoring.
- Model training bootstrap (if model files absent).
- A clean scoring API surface consumed by backend.

### Database owns
- Durable user/policy/claim/session/treasury records.
- Queryable audit trail for adjudication decisions.

## 4. Core Domain Concepts
- Policy: defines premium tier and coverage amount.
- WorkSession: active period of tracked worker behavior.
- WorkHeartbeat: minute-level activity pulse with hash chain.
- Claim: decision record with fraud/work/behavior scores and payout details.
- Treasury + TreasuryTransaction: explicit capital accounting for inflow/outflow.

## 5. Trust and Fraud Architecture
The trust system is a layered architecture:
1. Behavioral (P1): verifies natural timing jitter.
2. Environmental (P2): verifies city-level disruption evidence.
3. Session authenticity (P3): verifies recency/IP/chain consistency.
4. Ring detection (P4): detects suspicious clustered claim patterns.

Final trust score uses weighted aggregation:
- P1 25%
- P2 30%
- P3 30%
- P4 inverse-risk 15%

Decision defaults:
- `PAID` when trust >= threshold and additional backend guardrails pass.
- `REVIEW` otherwise.

## 6. Data and Control Paths

### Authentication Path
- `/api/auth/send-otp` -> store OTP record.
- `/api/auth/verify-otp` or `/api/auth/login-verify` -> issue JWT.
- JWT attached in Authorization header for all protected routes.

### Session Path
- Frontend heartbeat call every 60 seconds.
- Backend extends/creates `WorkSession` and appends `WorkHeartbeat`.
- Hash chain continues from prior hash.

### Claim Path
- User triggers claim simulation endpoint.
- Backend loads policy + latest session + environment evidence.
- Backend calls ML endpoints (if configured) and computes aggregate.
- Claim row persisted.
- If payable: treasury debit -> payout attempt -> claim update.

## 7. Deployment Shape (Expected)
- Frontend can be deployed static (Vercel config present).
- Backend should run as a Node server with PostgreSQL access.
- ML service should run as internal/private microservice.
- Secrets should come from env variables; do not rely on defaults in production.

## 8. Architectural Strengths
- Separation of concerns across UI/business/ML.
- Strong auditability through explicit claim and treasury records.
- Fallback behavior if ML service is unavailable.
- Easy demo mode via mock payment/payout toggles.

## 9. Architectural Risks and Improvements
- Hardcoded frontend API base URL should be env-driven.
- JWT fallback secrets are unsafe for production.
- Comments/legacy code in pages can increase maintenance cost.
- Need stronger transactional guarantees around payout+treasury operations under concurrency.
- Missing automated test suite for critical adjudication paths.
