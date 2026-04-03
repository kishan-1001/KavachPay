# Environment, Configuration, and Runbook

## 1. Runtime Topology
Local development expects three processes:
1. Backend API on port 5000.
2. Frontend Vite dev server.
3. ML service (FastAPI) on port 8000 (default in python app).

Root command:
- `npm run dev`

## 2. Root Scripts
From root `package.json`:
- `dev` runs backend + frontend + ml-service together.
- `install:all` installs dependencies for all services and sets up ml-service venv.

## 3. Backend Environment Variables
Observed usage in backend code:
- `PORT`
- `FRONTEND_URL`
- `DATABASE_URL`
- `JWT_SECRET`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `PAYMENT_MODE` (`mock` or `live` behavior in policy route)
- `PAYOUT_MODE` (`mock` or `live` behavior in payout service)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_FUND_ACCOUNT_ID`
- `RAZORPAY_ACCOUNT_NUMBER`
- `ML_SERVICE_URL`
- `NEWS_API_KEY`
- `AQI_API_KEY`
- `ADMIN_SEED_EMAIL`

## 4. ML Service Environment Variables
Observed in ml-service:
- `ML_SERVICE_PORT` (default 8000)
- `NEWS_API_KEY` (optional fallback)
- `AQI_API_KEY` (optional fallback)

## 5. Frontend Configuration
Current state:
- API base URLs are mostly hardcoded to `http://localhost:5000` in pages.
- Razorpay checkout script is included in `index.html`.
- No centralized env abstraction for API base URL yet.

Recommended:
- Add `VITE_API_BASE_URL` and use a shared api client.

## 6. Setup Sequence (Local)
1. Install root dependencies.
2. Install backend dependencies.
3. Install frontend dependencies.
4. Create python venv under `ml-service` and install requirements.
5. Configure PostgreSQL and `DATABASE_URL`.
6. Run Prisma migration.
7. Optionally seed admin/treasury.
8. Start all services.

## 7. Database Commands (Typical)
Run in backend folder:
- `npx prisma migrate dev`
- `npx prisma generate`

Optional seed scripts:
- `npx tsx scripts/seedAdminTreasury.ts`
- `npx tsx scripts/gigWorkerSmokeTest.ts`

## 8. Modes and Demo Controls

### Payment mode
- `PAYMENT_MODE=mock` bypasses real payment gateway flow for paid policy activation.

### Payout mode
- `PAYOUT_MODE=mock` creates synthetic payout references with no money movement.

Recommended demo setup:
- payment mock + payout mock + seeded treasury.

## 9. Security Notes for Production
- Remove fallback JWT secrets and require strong secret env.
- Restrict CORS origin from wildcard.
- Store sensitive API keys in secure secret manager.
- Use HTTPS and secure cookies/token strategy as needed.
- Add abuse controls for OTP and simulation endpoints.

## 10. Operational Monitoring Suggestions
- Health checks:
  - Backend root `/`
  - ML root `/`
- Log key events:
  - OTP send/verify outcomes
  - claim adjudication decisions
  - payout attempts and failures
  - treasury transactions
- Add alerting on:
  - payout failure rate spike
  - treasury low balance
  - high fraud score cluster surge

## 11. Troubleshooting Guide

### Problem: Signup OTP not received
Check:
- Brevo API key configured?
- sender email valid?
- OTP exists in DB?
- 30-second resend lock active?

### Problem: Claim always in REVIEW
Check:
- session heartbeats present?
- chain validity failing?
- environmental score too low?
- ML unavailable and fallback thresholds strict?

### Problem: Payout not executed
Check:
- claim status PAID?
- payout mode live vs mock?
- Razorpay payout credentials configured?
- treasury balance sufficient?

### Problem: Admin page redirects away
Check:
- logged-in user role is ADMIN in JWT/user record.

### Problem: ML calls always null
Check:
- backend `ML_SERVICE_URL` configured correctly.
- ml-service running on expected host/port.
- network/firewall restrictions.
