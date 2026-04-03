# KavachPay Project Overview

## 1. What This Project Is
KavachPay is a full-stack prototype of an automated, parametric insurance platform for gig workers. It combines:
- A React web application for workers and admins.
- A TypeScript/Express backend for authentication, policy management, session/work-proof collection, claim adjudication, and treasury operations.
- A Python FastAPI ML service for 4-pillar risk scoring.
- A PostgreSQL database accessed through Prisma.

The central product promise is:
- If a real disruption happens and work-proof/fraud checks pass, payouts are triggered automatically.

## 2. Core Product Idea
Traditional claims are manual and slow. KavachPay shifts from "manual claim investigation" to "event + trust signal adjudication":
- Environmental disruption evidence (weather/news/AQI).
- Behavioral proof (heartbeat jitter and anti-bot checks).
- Session authenticity (chain/IP/recency checks).
- Ring-risk detection across local claim clusters.

These are aggregated into a trust/fraud decision. If approved, payout is attempted and treasury is debited.

## 3. High-Level Components

### Frontend (React + Vite)
- Public routes: landing, signup, signin, how-it-works.
- Worker routes: dashboard, policy, claims, payouts.
- Admin route: admin console.
- Uses localStorage JWT token and direct API calls to backend.

### Backend (Express + Prisma)
- JWT auth + role checks.
- OTP email flow with Brevo.
- Policy creation/verification with Razorpay or mock mode.
- Work-session heartbeats and hash chain.
- Claim simulation and adjudication.
- Treasury credit/debit ledger.
- Admin stats + claim moderation + treasury tools.

### ML Service (FastAPI + scikit-learn)
Implements 4 pillars:
- Pillar 1: Behavioral auth (timing anomaly).
- Pillar 2: Environmental consensus risk.
- Pillar 3: Session authenticity score.
- Pillar 4: Ring/collusion risk.
- Aggregator: weighted final trust/fraud output.

### Data Layer
- Prisma schema covers users, OTPs, policies, sessions/heartbeats, claims, treasury, transactions.
- Auditability is enabled by storing chain hashes, heartbeat timeline, and claim notes.

## 4. Product Flows at a Glance
1. Signup/Login:
- User requests OTP -> verifies OTP -> receives JWT.

2. Policy Activation:
- Free tier direct activation or paid flow through order/verify (or mock paid activation).

3. Work Proof Collection:
- Dashboard sends heartbeats every 60s when user is active.
- Backend stores heartbeat + rolling chain hash.

4. Claim Trigger:
- User triggers simulation endpoint.
- Backend combines environmental + behavioral + session + ring signals.
- Creates claim with status PAID or REVIEW.

5. Payout and Treasury:
- On PAID, treasury is debited first.
- Payout service executes mock/live payout.
- On failure, treasury rollback and claim downgraded to REVIEW.

## 5. Technology Stack

### Root
- Monorepo-ish workspace with `backend`, `frontend`, `ml-service`.
- Root dev script launches all three concurrently.

### Backend
- Node.js, TypeScript, Express 5.
- Prisma ORM + PostgreSQL.
- JWT, Helmet, CORS, rate limiting.
- Axios + fetch for third-party APIs.

### Frontend
- React 19 + TypeScript.
- Vite build tooling.
- TailwindCSS v4 via PostCSS.
- React Router + React Query.

### ML Service
- Python, FastAPI, Uvicorn.
- scikit-learn, NumPy, joblib.
- Requests for third-party intelligence APIs.

## 6. Security and Trust Design Summary
- JWT auth middleware protects private endpoints.
- Admin middleware enforces role-based access.
- OTP route has anti-spam/rate controls.
- Hash-chain validation defends against fabricated activity trails.
- Fraud score and ring-risk reduce mass abuse potential.
- Treasury operations are recorded as explicit credit/debit transactions.

## 7. Important Prototype Characteristics
This codebase is strong as a hackathon/demo system, but has prototype decisions:
- Many frontend API URLs are hardcoded to `http://localhost:5000`.
- Multiple files contain large commented legacy versions (especially UI pages).
- Some risk/payout logic is tuned for deterministic demo behavior.
- Security defaults include fallback secrets; these should be hardened for production.

## 8. Documentation Map
Read in this sequence for full understanding:
1. `01-system-architecture.md`
2. `05-database-schema-and-data-flow.md`
3. `02-backend-architecture.md`
4. `04-ml-service-architecture.md`
5. `03-frontend-architecture.md`
6. `06-api-reference.md`
7. `07-operational-flows.md`
8. `08-env-config-and-runbook.md`
9. `09-file-by-file-map.md`
