# Frontend Architecture (React + Vite)

## 1. Frontend Purpose
The frontend is a single-page app responsible for:
- Onboarding and authentication flows.
- Policy purchase/activation flow.
- Work-proof session participation.
- Claim and payout transparency for workers.
- Operational controls for admins.

Main app entry:
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`

## 2. Routing Structure
Defined in `App.tsx`:
- `/` -> Landing
- `/signup` -> Signup
- `/signin` -> Signin
- `/dashboard` -> Worker dashboard
- `/policy` -> Policy selection and activation
- `/claims` -> Claim history and signal details
- `/payout` -> Payout history
- `/admin` -> Admin control panel
- `/howitworks` -> Product explainer

## 3. UI/State Strategy
- Route-level pages own most state with `useState` + `useEffect`.
- Token/user identity are read from `localStorage`.
- API calls are currently direct `fetch`/`axios` calls to `http://localhost:5000`.
- React Query provider is initialized but data fetching is mostly manual right now.

## 4. Page-by-Page Breakdown

### 4.1 Landing page (`Landing.tsx`)
- Marketing-focused narrative page.
- Includes feature sections, pricing cards, FAQ, testimonials, and CTA blocks.
- Mostly static content with light interaction (feature cycling, FAQ expansion).
- Uses public assets from `frontend/public`.

### 4.2 Signup page (`Signup.tsx`)
3-step flow:
1. Identity verification + email OTP.
2. Work profile details (platform/city/earnings).
3. UPI payout destination.

Key behaviors:
- Sends OTP and verifies code.
- Enforces countdown for OTP resend.
- Calls registration endpoint once form complete.
- Saves JWT/user in localStorage and redirects dashboard.

### 4.3 Signin page (`Signin.tsx`)
2-step login:
1. Request OTP for existing email.
2. Verify OTP and obtain token.

Includes OTP animation overlay for visual confirmation.

### 4.4 Dashboard page (`Dashboard.tsx`)
This is the operational center for workers.

Main responsibilities:
- Fetch profile, policy, and latest claim.
- Trigger and maintain heartbeat tracking.
- Collect local interaction signals (mouse/keyboard/visibility).
- Show live stats (heartbeats, jitter, session age, plan tier).
- Trigger disruption simulation claim.
- Provide navigation to claims/payout/policy.

Heartbeat logic details:
- Marks local user activity.
- Sends `/api/session/heartbeat` approximately every minute while recently active.
- Periodically fetches `/api/session/activity-stats`.

### 4.5 Policy page (`Policy.tsx`)
- Displays available tiers (BASIC, STANDARD, PREMIUM).
- Handles free activation path.
- Handles order creation and Razorpay checkout for paid plans.
- Handles verification callback for paid activation.
- If user already has active policy, shows active-policy card instead.

Note:
- File contains a large commented legacy implementation followed by active implementation.

### 4.6 Claims page (`Claims.tsx`)
- Fetches all user claims.
- Displays status chips, scores, and expandable evidence details.
- Shows trust/risk bars and adjudication notes.
- Includes status-based filtering.

Note:
- Includes a large commented old version before current version.

### 4.7 Payout page (`Payout.tsx`)
- Fetches PAID claims with amounts > 0.
- Shows payout timeline and aggregate payout amount.
- Displays payout references where available.

### 4.8 Admin page (`Admin.tsx`)
- Restricted to users with ADMIN role.
- Fetches system stats, claims, treasury summary.
- Supports top-up action.
- Supports manual claim approve/reject.
- Shows dashboard-like analytics cards and transaction table.

Note:
- Includes large commented legacy admin UI followed by active implementation.

### 4.9 How-it-works page (`HowItWorks.tsx`)
- Product education page.
- Explains pipeline from weather detection to payout.
- Shows feature matrix, flow steps, FAQ.

## 5. Shared Components and Styles

### `OtpAnimationOverlay.tsx`
- Full-screen animated overlay used during OTP verification moments.

### Styling
- Tailwind CSS v4 imported in `index.css`.
- Small custom keyframes for animation effects.
- `App.css` is currently placeholder-only.

## 6. Frontend -> Backend Contract Patterns
Typical request pattern:
- Read token from localStorage.
- Send `Authorization: Bearer <token>` for protected routes.
- Render returned JSON directly into cards/tables.

Primary endpoint groups used:
- `/api/auth/*`
- `/api/policy/*`
- `/api/user/profile`
- `/api/session/*`
- `/api/claim/*`
- `/api/admin/*`

## 7. UX Characteristics
- High visual polish with responsive card-based layouts.
- Distinct worker vs admin themes.
- Transparent trust/risk visibility for user confidence.
- Heavy use of iconography and status microcopy.

## 8. Frontend Risks and Improvements
- API URLs should be centralized and env-driven.
- Introduce typed API client layer to avoid shape drift.
- Replace `any` typing with domain interfaces.
- Migrate repeated data fetching to React Query hooks.
- Remove legacy commented blocks to reduce bundle/source noise.
- Add route guards and token-expiry handling workflow.
