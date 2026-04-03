# Database Schema and Data Flow

## 1. Database Technology
- PostgreSQL through Prisma ORM.
- Schema source: `backend/prisma/schema.prisma`.
- Initial migration: `backend/prisma/migrations/20260331072021_init/migration.sql`.

## 2. Entity Map

```text
User
 |- policies -> Policy
 |- claims -> Claim
 |- sessions -> WorkSession
 |- treasuryTransactions (as createdBy)

Policy
 |- user (owner)
 |- claims

WorkSession
 |- user
 |- heartbeats -> WorkHeartbeat

Claim
 |- user
 |- policy

Treasury
 |- transactions -> TreasuryTransaction

TreasuryTransaction
 |- treasury
 |- createdBy (optional User)

OtpVerification (standalone auth utility table)
EnvironmentalEvent (currently not central in route flow)
```

## 3. Model Details

### User
Stores identity, work profile, trust score, and role.
Important fields:
- `email` unique
- `role` (WORKER/ADMIN)
- `trustScore` default 1.0
- `isVerified`

### OtpVerification
Stores OTP lifecycle for signup/login.
- email, otp code, expiry, verified state.

### Policy
Insurance product assignment per user.
- tier, status, coverage, premium paid, start/end dates.
- optional Razorpay order/payment IDs.

### WorkSession
Minute-level work-proof session.
- rolling hash state (`sessionHash`, `previousSessionHash`).
- active minutes, IP, IP city, start/end times.

### WorkHeartbeat
Time-series pulses attached to session.
- timestamp, ipAddress, hash.

### Claim
Adjudication output.
- status, fraud/work/behavior scores.
- chain validity boolean.
- payout amount and payout reference.
- reviewer notes with evidence text.

### Treasury
Global treasury account (singleton by name).
- balance, currency.

### TreasuryTransaction
Ledger entries for all treasury movements.
- direction (CREDIT/DEBIT)
- type (PREMIUM/PAYOUT/TOPUP/ADJUSTMENT)
- amount and balance after movement
- optional reference links

## 4. Enums
- `Role`: WORKER, ADMIN
- `PlanTier`: BASIC, STANDARD, PREMIUM
- `PolicyStatus`: ACTIVE, EXPIRED, CANCELLED
- `ClaimStatus`: PENDING, PAID, REVIEW, REJECTED, APPEALED
- `TreasuryDirection`: CREDIT, DEBIT
- `TreasuryTransactionType`: PREMIUM, PAYOUT, TOPUP, ADJUSTMENT

## 5. Integrity/Indexing Highlights
- Unique: user email, policy order/payment IDs, claim payout id, treasury name.
- Useful indexes:
  - policy by `(status, userId)`
  - session by `(userId, startTime DESC)`
  - heartbeat by `sessionId`
  - claim by `(userId, status)`
  - treasury tx by `(treasuryId, createdAt DESC)`

## 6. Lifecycle Data Flows

### A. Signup/Login
1. OTP row created.
2. OTP row verified.
3. User row created (signup) or loaded (login).
4. JWT returned.

### B. Policy Activation
1. Existing active policy check.
2. Policy row inserted with premium and coverage.
3. Treasury credit transaction for premium in paid paths.

### C. Work Session Tracking
1. Heartbeat call arrives.
2. Recent session loaded or created.
3. Hash chain updated.
4. WorkHeartbeat row inserted.
5. WorkSession `activeMinutes` and `sessionHash` updated.

### D. Claim Adjudication
1. Latest session + heartbeats loaded.
2. External/ML signals computed.
3. Claim row inserted (PAID/REVIEW).
4. On payable claim: treasury debit + payout reference update.
5. On payout failure: treasury adjustment credit + claim status fallback.

### E. Admin Moderation
1. Admin updates claim status.
2. Optional manual payout and treasury debit.

## 7. Accounting Semantics
Treasury behaves like an internal ledger:
- Every balance change should correspond to a transaction row.
- Claim payout pipeline debits treasury before payout attempt.
- Failures are compensated by adjustment credit entries.

This creates an auditable financial trail even in mock payout mode.

## 8. Schema Observations
- `EnvironmentalEvent` exists but is not heavily used by current routes.
- Claim model does not have explicit `trustScore` column; trust is inferred and embedded in notes/response.
- Session hash strategy is captured both at session and heartbeat granularity for forensic replay.

## 9. Recommended DB Enhancements
- Add explicit claim-level `trustScore` and `decisionReason` fields.
- Add soft-delete or archival strategy for old heartbeats.
- Add optimistic locking/versioning for treasury row.
- Add explicit foreign-key references for more `referenceType/referenceId` values where possible.
