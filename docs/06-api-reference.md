# API Reference

Base URL (local): `http://localhost:5000`

## 1. Authentication APIs

### POST `/api/auth/send-otp`
Purpose: send registration OTP.
Body:
```json
{ "email": "user@example.com" }
```
Responses:
- 200 success message
- 429 rate-limited
- 400/500 error

### POST `/api/auth/verify-otp`
Purpose: verify signup OTP.
Body:
```json
{ "email": "user@example.com", "otp": "123456" }
```

### POST `/api/auth/login-send-otp`
Purpose: send login OTP for existing user.

### POST `/api/auth/login-verify`
Purpose: verify login OTP and issue JWT.
Success payload includes:
- `token`
- `user` object

### POST `/api/auth/register`
Purpose: create user after OTP verification.
Required fields:
- fullName, email, city, deliveryPlatform, vehicleType, weeklyEarnings
Optional:
- phoneNumber, upiId

## 2. Policy APIs

### GET `/api/policy`
Auth: required
Returns active policy or null.

### POST `/api/policy/order`
Auth: required
Body:
```json
{ "planTier": "BASIC|STANDARD|PREMIUM" }
```
Behavior:
- BASIC may activate instantly (`freeActivated`).
- Mock mode may instantly activate paid policy (`mockActivated`).
- Live mode returns Razorpay order object.

### POST `/api/policy/activate-free`
Auth: required
Activates BASIC policy directly.

### POST `/api/policy/verify`
Auth: required
Verifies Razorpay payment signature and activates paid policy.
Body includes:
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`
- `planTier`

## 3. User API

### GET `/api/user/profile`
Auth: required
Returns profile fields and trust score.

## 4. Session APIs

### POST `/api/session/heartbeat`
Auth: required
Records/extents work session heartbeat.
Returns:
- `activeMinutes`
- `sessionHash`
- `ipCity`
- `ipSource`

### GET `/api/session/activity-stats`
Auth: required
Returns:
- heartbeatCount, sessionAgeMins, avgHeartbeatGapMs, jitterMs, etc.

## 5. Claim APIs

### POST `/api/claim/simulate-disruption`
Auth: required
Main adjudication trigger.
Returns:
- created/updated claim
- ML breakdown (pillar scores, trust/fraud, decision metadata)

### GET `/api/claim/history?limit=5`
Auth: required
Returns latest user claims.

### GET `/api/claim/all`
Auth: required
Returns full user claim history.

### GET `/api/claim/payouts`
Auth: required
Returns paid claims with totals.

## 6. Admin APIs
(All require auth + ADMIN role)

### GET `/api/admin/stats`
Global stats + treasury snapshot.

### GET `/api/admin/treasury`
Treasury summary + latest transactions.

### POST `/api/admin/treasury/topup`
Body:
```json
{ "amount": 25000, "note": "Demo top-up" }
```

### GET `/api/admin/claims`
Returns all claims with user/policy information.

### PUT `/api/admin/claims/:id/status`
Body:
```json
{ "status": "PAID|REJECTED|REVIEW", "reviewerNotes": "..." }
```

## 7. ML Service APIs
Base URL: value of `ML_SERVICE_URL` in backend environment.

### GET `/`
Service health.

### GET `/api/models/status`
Loaded models report.

### POST `/api/pillar1/behavioral-auth`
Body:
```json
{ "heartbeatTimestamps": ["2026-04-04T10:00:00Z"] }
```

### POST `/api/pillar2/environmental-consensus`
Body:
```json
{ "city": "Bengaluru" }
```
Optional headers:
- `x-news-api-key`
- `x-aqi-api-key`

### POST `/api/pillar3/session-authenticity`
Payload includes user/session/city/heartbeat chain signals.

### POST `/api/pillar4/ring-detect`
Body includes claim cluster list.

### POST `/api/score/aggregate`
Body:
```json
{
  "pillar1Score": 0.8,
  "pillar2Score": 0.7,
  "pillar3Score": 0.9,
  "pillar4RingRisk": 0.1
}
```

## 8. Common Auth Header
For protected routes:
```http
Authorization: Bearer <jwt>
```

## 9. Error Behavior
Typical patterns:
- 400 for validation/invalid inputs.
- 401 for missing or invalid token.
- 403 for permission or policy constraints.
- 404 for not found entities.
- 429 for OTP/rate limit scenarios.
- 500 for server failures.
