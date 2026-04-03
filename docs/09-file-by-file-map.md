# File-by-File Project Map

This map documents authored project files (excluding README files) and explains each file's purpose.

## 1. Root

### `package.json`
- Workspace-level scripts to run backend, frontend, and ml-service together.
- Includes `concurrently` dev dependency.

### `package-lock.json`
- NPM dependency lock file for root-level reproducibility.

## 2. `backend/`

### Config and package files
- `.env`: runtime environment values for backend (secrets/config).
- `.gitignore`: backend git ignore rules.
- `package.json`: backend dependencies and scripts.
- `package-lock.json`: backend lockfile.
- `prisma.config.ts`: Prisma runtime config.
- `tsconfig.json`: TypeScript compiler settings.

### Prisma files
- `prisma/schema.prisma`: database model source of truth.
- `prisma/migrations/migration_lock.toml`: migration engine lock metadata.
- `prisma/migrations/20260331072021_init/migration.sql`: initial SQL migration.

### Utility scripts
- `scripts/seedAdminTreasury.ts`: seeds admin + treasury + optional top-up.
- `scripts/gigWorkerSmokeTest.ts`: synthetic end-to-end workflow test script.

### Runtime source

#### Core
- `src/index.ts`: express app bootstrap, security middleware, route mounts.
- `src/prismaClient.ts`: singleton Prisma client export.

#### Middleware
- `src/middleware/authMiddleware.ts`: JWT verification and user context injection.
- `src/middleware/adminMiddleware.ts`: admin-only route guard.

#### Routes
- `src/routes/auth.ts`: OTP send/verify, login, register.
- `src/routes/policy.ts`: policy retrieval, order, free activation, payment verify.
- `src/routes/user.ts`: authenticated user profile endpoint.
- `src/routes/session.ts`: heartbeat ingestion and session activity stats.
- `src/routes/claim.ts`: disruption simulation/adjudication and claim history/payout history.
- `src/routes/admin.ts`: admin KPIs, treasury endpoints, claim moderation actions.

#### Services
- `src/services/behavioralProfiler.ts`: jitter-based local behavioral scoring fallback.
- `src/services/environmentalEngine.ts`: external intelligence aggregation fallback.
- `src/services/ipIntel.ts`: IP extraction, lookup, and city-match utilities.
- `src/services/mlClient.ts`: ML-service API client wrapper with null fallback.
- `src/services/payoutService.ts`: mock/live payout execution logic.
- `src/services/treasuryService.ts`: treasury creation, credit/debit, summary, transaction fetch.

#### Generated
- `src/generated/prisma/**`: generated Prisma client artifacts (do not hand-edit).

## 3. `frontend/`

### Config and package files
- `.gitignore`: frontend ignore rules.
- `package.json`: frontend dependencies and scripts.
- `package-lock.json`: lockfile.
- `tsconfig.json`: TypeScript compile config for frontend.
- `vite.config.ts`: Vite config using React plugin.
- `eslint.config.ts`: linting configuration.
- `postcss.config.ts`: Tailwind and autoprefixer plugins.
- `vercel.json`: SPA rewrite rule for Vercel deployment.
- `index.html`: root HTML, font import, Razorpay checkout script.

### Public assets
- `public/KavachPay_logo.png`: brand logo.
- `public/gigworker.png`: landing visual asset.
- `public/gigworkeratrain.mp4`: video hero asset.
- `public/getpaid.png`, `public/register.png`, `public/work.png`: additional static visuals.

### Source

#### App shell
- `src/main.tsx`: React root mounting.
- `src/App.tsx`: router + page route definitions.
- `src/index.css`: Tailwind import + global utility animation styles.
- `src/App.css`: placeholder css file.
- `src/vite-env.d.ts`: Vite typing declarations.

#### Components
- `src/components/OtpAnimationOverlay.tsx`: animated overlay component for OTP verification moments.

#### Pages
- `src/pages/Landing.tsx`: public marketing homepage and CTAs.
- `src/pages/Signup.tsx`: onboarding wizard with OTP verification.
- `src/pages/Signin.tsx`: OTP-based login flow.
- `src/pages/Dashboard.tsx`: worker control center with heartbeats and claim trigger.
- `src/pages/Policy.tsx`: plan selection and payment activation flow.
- `src/pages/Claims.tsx`: detailed claim history with trust/risk breakdown.
- `src/pages/Payout.tsx`: payout timeline and totals.
- `src/pages/Admin.tsx`: admin operations panel for treasury and claim moderation.
- `src/pages/HowItWorks.tsx`: explainer page with process and FAQ.

## 4. `ml-service/`

### Runtime files
- `main.py`: FastAPI app and pillar endpoint implementations.
- `model_hub.py`: model file management, synthetic training bootstrap, prediction methods.
- `scoring.py`: weighted pillar aggregation function.
- `requirements.txt`: python dependency pins.

### Models
- `models/fraud_model.pkl`: anomaly model.
- `models/risk_model.pkl`: environmental risk model.
- `models/work_proof_model.pkl`: session authenticity model.
- `models/ring_detector.pt`: ring-risk logistic model artifact.

### Transient artifacts
- `__pycache__/*`: Python cache files.
- `venv/*`: local virtual environment and installed packages.

## 5. `docs/`

### Existing docs
- `authetication.txt`: rough auth-flow notes.
- `ml.txt`: rough ML/fallback notes and thresholds.

### Newly added architecture docs
- `00-project-overview.md`
- `01-system-architecture.md`
- `02-backend-architecture.md`
- `03-frontend-architecture.md`
- `04-ml-service-architecture.md`
- `05-database-schema-and-data-flow.md`
- `06-api-reference.md`
- `07-operational-flows.md`
- `08-env-config-and-runbook.md`
- `09-file-by-file-map.md`

## 6. Dependency and Artifact Notes
- Node modules and generated Prisma files are intentionally excluded from detailed narrative because they are auto-generated/vendor-managed.
- Binary assets (images/video/model binaries) are documented by purpose rather than internals.

## 7. Suggested Reading Order for New Developers
1. `docs/00-project-overview.md`
2. `docs/01-system-architecture.md`
3. `docs/05-database-schema-and-data-flow.md`
4. `docs/02-backend-architecture.md`
5. `docs/04-ml-service-architecture.md`
6. `docs/03-frontend-architecture.md`
7. `docs/06-api-reference.md`
8. `docs/07-operational-flows.md`
9. `docs/08-env-config-and-runbook.md`
10. `docs/09-file-by-file-map.md`
