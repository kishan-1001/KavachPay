# Operational Flows (Step-by-Step)

## 1. Worker Signup and First Login
1. User opens signup page.
2. Requests OTP by email.
3. Backend generates OTP, stores record, sends via Brevo (if key present).
4. User verifies OTP.
5. User completes profile and submits registration.
6. Backend creates user and returns JWT.
7. Frontend stores JWT and routes to dashboard.

## 2. Returning User Login
1. User enters email on signin page.
2. Backend checks user existence and sends OTP.
3. User submits OTP.
4. Backend verifies OTP and returns JWT + profile snippet.

## 3. Policy Purchase/Activation

### Free path
1. Worker chooses BASIC.
2. Frontend calls `/api/policy/activate-free`.
3. Backend creates active BASIC policy (31-day duration).

### Paid path (mock)
1. Worker chooses STANDARD/PREMIUM.
2. Backend in mock mode creates policy directly and credits treasury.

### Paid path (live)
1. Frontend requests order from `/api/policy/order`.
2. Razorpay checkout completes.
3. Frontend sends verification payload to `/api/policy/verify`.
4. Backend verifies signature, activates policy, credits treasury.

## 4. Work-Proof Session Tracking
1. Dashboard tracks local interactions.
2. Every ~60 sec it sends `/api/session/heartbeat` if user recently active.
3. Backend resolves IP context.
4. Backend creates or extends `WorkSession`.
5. Backend stores new `WorkHeartbeat` with rolling chain hash.
6. Dashboard periodically queries `/api/session/activity-stats`.

Outcome:
- Session gets auditable minute-by-minute work-proof history.

## 5. Claim Adjudication (Simulation Flow)
1. User clicks disruption simulation.
2. Backend loads:
   - active policy
   - latest session + heartbeats
3. Backend computes environment evidence (ML or local fallback).
4. Backend computes behavioral score (P1) from heartbeat jitter.
5. Backend replays heartbeat hash chain for integrity.
6. Backend computes session authenticity (P3) and ring risk (P4).
7. Backend aggregates pillars into trust/fraud score.
8. Backend creates claim with status PAID or REVIEW.

## 6. Payout Execution Flow
When claim is payable:
1. Debit treasury by payout amount.
2. Call payout service.
3. If payout succeeds:
   - store payout reference in claim.
4. If payout fails:
   - credit treasury rollback adjustment.
   - set claim back to REVIEW.

This sequence prevents silent fund leakage and preserves accounting traceability.

## 7. Trust Score Feedback Loop
After claim adjudication:
- Clean paid claim can increase user trust score.
- High-fraud behavior can reduce trust score.

This creates behavioral memory in user profile for future claims.

## 8. Admin Review Flow
1. Admin opens global claim ledger.
2. Filters suspicious/pending claims.
3. Approves or rejects claim manually.
4. If approving and unpaid, payout path is attempted.
5. Treasury and claim notes reflect action outcomes.

## 9. Treasury Operations Flow
1. Premium collections credit treasury.
2. Payout approvals debit treasury.
3. Admin top-up adds credit transaction.
4. Failures create adjustment transactions.
5. Admin views summary and transaction timeline.

## 10. Failure and Fallback Flows

### ML unavailable
- Backend `mlClient` returns null.
- Local scoring/fallback logic is used to proceed.

### External intelligence unavailable
- Environmental score falls back to conservative/default evidence path.

### Payment provider failures
- User remains unactivated until verification success.

### Payout provider failures
- Claim downgraded to REVIEW and treasury rollback occurs.

## 11. Practical User Journey Example
1. Worker signs up and activates policy.
2. Worker starts shift and dashboard heartbeats run.
3. Severe weather event is simulated/detected.
4. Claim is adjudicated with multi-pillar evidence.
5. Worker sees claim status:
   - PAID with payout amount and reference, or
   - REVIEW with notes and confidence signals.
6. Worker can inspect claim and payout pages for full transparency.
