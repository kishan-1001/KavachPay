# Backend Architecture (Express + Prisma)

## 1. Backend Purpose
The backend is the system coordinator. It:
- Authenticates users/admins.
- Stores and validates policy/session/claim data.
- Runs adjudication orchestration.
- Integrates payment, payout, and intelligence services.
- Maintains treasury ledger integrity.

Entry point: `backend/src/index.ts`

## 2. Request Pipeline

### Global middlewares
- `helmet()` for secure headers.
- `express-rate-limit` for `/api/*` request throttling.
- `cors` with `FRONTEND_URL` support.
- `express.json` body parsing.

### Route mounting
- `/api/auth`
- `/api/policy`
- `/api/user`
- `/api/session`
- `/api/claim`
- `/api/admin`

## 3. Authentication and Authorization

### JWT middleware
File: `backend/src/middleware/authMiddleware.ts`
- Reads `Authorization: Bearer <token>`.
- Verifies token using `JWT_SECRET`.
- Injects `req.user = { userId, role, city }`.

### Admin middleware
File: `backend/src/middleware/adminMiddleware.ts`
- Requires `req.user.role === 'ADMIN'`.

## 4. Route Modules

### 4.1 Auth routes
File: `backend/src/routes/auth.ts`

Endpoints:
- `POST /send-otp`
- `POST /verify-otp`
- `POST /login-send-otp`
- `POST /login-verify`
- `POST /register`

Behavior highlights:
- OTP resend rate limit (30s window).
- OTP expiry is 60 seconds.
- Unverified OTP invalidation before new OTP issue.
- Optional Brevo API email sending.
- Registration requires verified OTP record.
- Login and signup both return JWT (7d).

### 4.2 Policy routes
File: `backend/src/routes/policy.ts`

Endpoints:
- `GET /` get active policy
- `POST /order` create payment order or direct activation
- `POST /activate-free` explicit free policy activation
- `POST /verify` verify Razorpay signature and activate paid policy

Business rules:
- One active policy at a time.
- Tier prices in paise, coverage in rupees.
- BASIC can activate instantly (free).
- Mock payment mode can simulate paid activation and treasury credit.
- Real mode uses Razorpay order + signature verification.

Treasury side effect:
- Premium credits treasury when paid policy activates.

### 4.3 User routes
File: `backend/src/routes/user.ts`
- `GET /profile` for authenticated profile read.

### 4.4 Session routes
File: `backend/src/routes/session.ts`

Endpoints:
- `POST /heartbeat`
- `GET /activity-stats`

Key mechanism:
- Uses IP intelligence service to resolve IP + city context.
- Builds/extends work session as heartbeat stream.
- Computes hash-chain with HMAC SHA256.
- Stores minute-level heartbeat records.
- Returns active minutes, hash, and IP source.

Hash design:
- New hash = HMAC(secret, data + previous_hash)
- Data includes `userId`, minute number, ip, startTime.

### 4.5 Claim routes
File: `backend/src/routes/claim.ts`

Main endpoints:
- `POST /simulate-disruption`
- `GET /history`
- `GET /all`
- `GET /payouts`

`simulate-disruption` orchestration:
1. Load user + active policy.
2. Load latest work session + heartbeats.
3. Get environmental score (ML-first, local fallback).
4. Compute behavioral score (P1).
5. Re-validate full heartbeat hash chain.
6. Build ring-risk payload from nearby claims.
7. Call ML pillars and aggregate score if available.
8. Derive claim decision and save claim row.
9. If payable: debit treasury then initiate payout.
10. On payout failure: rollback treasury and move claim to REVIEW.
11. Update user trust score heuristically.

### 4.6 Admin routes
File: `backend/src/routes/admin.ts`

Endpoints:
- `GET /stats`
- `GET /treasury`
- `POST /treasury/topup`
- `GET /claims`
- `PUT /claims/:id/status`

Admin capabilities:
- Platform KPI aggregation (users/policies/fraud/payout/premium).
- Treasury monitoring and manual top-up.
- Manual claim decision override.
- Manual payout attempt for approved claims.

## 5. Service Layer

### 5.1 `behavioralProfiler.ts`
- Local jitter/stddev classifier fallback.
- Score bands:
  - `<150ms` -> high bot suspicion.
  - `<400ms` -> suspicious.
  - otherwise human-like.

### 5.2 `environmentalEngine.ts`
- Open-Meteo geocode + weather.
- NewsAPI corroboration.
- AQICN AQI signal.
- Weighted disruption score synthesis.

### 5.3 `ipIntel.ts`
- Extracts client IP from forwarded header or socket.
- Localhost maps to mock city-specific IP for demos.
- Best-effort IP city lookup via ip-api.com.
- Loose city matching utility for tolerance.

### 5.4 `mlClient.ts`
- Optional integration to ML service via `ML_SERVICE_URL`.
- Posts to pillar endpoints.
- Returns `null` on failure to allow fallback logic.

### 5.5 `payoutService.ts`
- `PAYOUT_MODE=mock` default for safe demos.
- Live mode requires Razorpay payout config.
- Creates payout and returns payout id/message.

### 5.6 `treasuryService.ts`
- Ensures singleton treasury account.
- Credit/debit helpers write both balance and transaction record.
- Summary and recent transactions helpers for admin panel.

## 6. Data Access
- Prisma client in `backend/src/prismaClient.ts`.
- Most route handlers directly use Prisma methods.
- Services use Prisma for dedicated transactional semantics.

## 7. Backend Scripts

### `seedAdminTreasury.ts`
- Upserts admin user.
- Ensures treasury exists.
- Optional top-up when balance low.

### `gigWorkerSmokeTest.ts`
- Full end-to-end synthetic scenario:
  - creates user/policy/session
  - generates hash-chain heartbeats
  - runs behavioral logic
  - creates claim
  - attempts payout

## 8. Reliability Patterns
- ML outage fallback to local logic.
- Payout failure rollback via treasury credit adjustment.
- Defensive defaults around claim confidence and recency.

## 9. Backend Production Hardening Checklist
- Enforce strong, required `JWT_SECRET` (no fallback).
- Move all magic thresholds into config.
- Add request validation schemas (zod/joi).
- Add DB transactions around claim+payout state changes.
- Add structured logging and tracing.
- Add unit/integration tests for adjudication edge cases.
