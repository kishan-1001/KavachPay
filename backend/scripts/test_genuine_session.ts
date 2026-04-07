/**
 * ✅ SCRIPT 1: GENUINE WORK SESSION
 * =====================================
 * Simulates Arjun — a real Zomato delivery worker in Mumbai
 * who logged in at 7PM (peak dinner hour), had 50 heartbeats
 * with natural human jitter, valid HMAC chain, and matching IP city.
 *
 * Expected result: HIGH trust score → INSTANT PAYOUT
 *
 * Run: npx tsx scripts/test_genuine_session.ts
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import crypto from 'crypto';
import prisma from '../src/prismaClient.js';

const BACKEND_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'kavach_pay_secret_zero_trust_2026';

// ─── Config ────────────────────────────────────────────────────────────────────

const WORKER = {
  fullName:         'Arjun Mehta (Genuine)',
  email:            `genuine_worker_${Date.now()}@kavachtest.com`,
  city:             'Mumbai',
  deliveryPlatform: 'Zomato',
  vehicleType:      'Two-wheeler',
  weeklyEarnings:   6500,
  upiId:            'arjun.genuine@upi',
  phoneNumber:      '9876543210',
};

const HEARTBEATS      = 50;    // 50 minutes of active session — well above the 45-min threshold
const RECENCY_MINS    = 2;     // last heartbeat was 2 mins ago — fresh, active
const IP_ADDRESS      = '49.36.195.10'; // Mumbai ISP — matches registered city
const IP_CITY         = 'Mumbai';
const LOGIN_HOUR      = 19;    // 7 PM — peak dinner delivery window

// ─── Helpers ───────────────────────────────────────────────────────────────────

function humanJitter(baseMs: number, index: number): number {
  // Realistic human jitter: ±500-1500ms variance, some network delay spikes
  const patterns = [1200, -400, 800, -1100, 1500, -300, 950, -750, 1300, -600];
  return baseMs + patterns[index % patterns.length] + Math.round(Math.sin(index) * 200);
}

function buildChain(userId: string, startTime: Date, ipAddress: string, count: number) {
  let runningHash = '';
  const hashes: string[] = [];

  for (let i = 0; i < count; i++) {
    const dataStr = `${userId}-${i + 1}-${ipAddress}-${startTime.toISOString()}`;
    const hash = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(dataStr + runningHash)
      .digest('hex');
    hashes.push(hash);
    runningHash = hash;
  }
  return hashes;
}

function log(label: string, value?: unknown) {
  if (value === undefined) {
    console.log(`\n${'─'.repeat(60)}\n  ${label}\n${'─'.repeat(60)}`);
  } else {
    console.log(`  ${label.padEnd(30)}`, value);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🟢  GENUINE WORKER SIMULATION — KavachPay ML Test');
  console.log('════════════════════════════════════════════════════\n');

  // ── 1. Create user + policy directly in DB ──────────────────────────────────
  log('STEP 1: Creating worker profile in DB');

  const user = await prisma.user.upsert({
    where:  { email: WORKER.email },
    update: {},
    create: {
      ...WORKER,
      weeklyEarnings: WORKER.weeklyEarnings,
      isVerified: true,
      trustScore: 0.5,
    },
  });
  log('User created', user.id);
  log('City', user.city);
  log('Email', user.email);

  const policy = await prisma.policy.create({
    data: {
      userId:         user.id,
      planTier:       'STANDARD',
      status:         'ACTIVE',
      coverageAmount: 2000,
      premiumPaid:    55,
      startDate:      new Date(),
      endDate:        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  log('Policy created', policy.id);
  log('Coverage amount', `₹${policy.coverageAmount}`);

  // ── 2. Build session timestamps (backdated to simulate real session) ─────────
  log('STEP 2: Building work session with human-like heartbeats');

  // Session started LOGIN_HOUR:00, last heartbeat RECENCY_MINS ago
  const now       = new Date();
  const lastHbAt  = new Date(now.getTime() - RECENCY_MINS * 60_000);

  // Build cumulative offsets from startTime going forward
  const cumulativeGaps: number[] = [0];
  for (let i = 1; i < HEARTBEATS; i++) {
    cumulativeGaps.push(cumulativeGaps[i - 1] + humanJitter(60_000, i));
  }

  // Session started such that the LAST heartbeat lands at lastHbAt
  const totalSpanMs = cumulativeGaps[cumulativeGaps.length - 1];
  const startTime   = new Date(lastHbAt.getTime() - totalSpanMs);
  const timestamps  = cumulativeGaps.map(offset => new Date(startTime.getTime() + offset));

  log('Session start time', startTime.toLocaleTimeString());
  log('Last heartbeat', `${RECENCY_MINS} mins ago`);
  log('Total heartbeats', HEARTBEATS);
  log('Avg gap', '~60s with natural jitter (±500–1500ms)');
  log('Login hour', `${startTime.getHours()}:00 (${startTime.getHours() >= 18 ? '✅ peak dinner hour' : '⚠️ off-peak'})`);

  // ── 3. Build HMAC hash chain ─────────────────────────────────────────────────
  log('STEP 3: Building cryptographic HMAC-SHA256 chain');
  const hashes = buildChain(user.id, startTime, IP_ADDRESS, HEARTBEATS);
  log('Chain built', `${HEARTBEATS} links`);
  log('First hash (truncated)', hashes[0].slice(0, 20) + '...');
  log('Last hash (truncated)',  hashes[HEARTBEATS - 1].slice(0, 20) + '...');

  // Verify chain self-consistency
  let chainCheck = '';
  let selfValid = true;
  for (let i = 0; i < HEARTBEATS; i++) {
    const dataStr = `${user.id}-${i + 1}-${IP_ADDRESS}-${startTime.toISOString()}`;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(dataStr + chainCheck).digest('hex');
    if (expected !== hashes[i]) { selfValid = false; break; }
    chainCheck = expected;
  }
  log('Self-verification', selfValid ? '✅ CHAIN VALID' : '❌ CHAIN BROKEN');

  // ── 4. Persist session + heartbeats to DB ───────────────────────────────────
  log('STEP 4: Writing session and heartbeats to database');

  const session = await prisma.workSession.create({
    data: {
      userId:              user.id,
      startTime,
      endTime:             lastHbAt,
      activeMinutes:       HEARTBEATS,
      ipAddress:           IP_ADDRESS,
      ipCity:              IP_CITY,
      platformActiveFlag:  true,
      sessionHash:         hashes[HEARTBEATS - 1],
      previousSessionHash: hashes[HEARTBEATS - 2],
      heartbeats: {
        create: timestamps.map((ts, i) => ({
          timestamp: ts,
          ipAddress: IP_ADDRESS,
          hash:      hashes[i],
        })),
      },
    },
    include: { heartbeats: { orderBy: { timestamp: 'asc' } } },
  });
  log('Session created', session.id);
  log('Active minutes', session.activeMinutes);
  log('IP city', session.ipCity);
  log('IP matches registered city', session.ipCity === user.city ? '✅ YES' : '❌ NO');

  // ── 5. Get a real JWT from the server (seed verified OTP, then call login-verify) ────
  log('STEP 5: Getting a real JWT from the server via login flow');

  const OTP_CODE = '888888';
  // Delete any old OTPs for this email first
  await prisma.otpVerification.deleteMany({ where: { email: WORKER.email } });
  // Seed a pre-verified OTP so we can call login-verify directly
  await prisma.otpVerification.create({
    data: {
      email:    WORKER.email,
      otpCode:  OTP_CODE,
      expiresAt: new Date(Date.now() + 5 * 60_000),
      verified: false, // login-verify will mark it verified
    },
  });
  log('OTP seeded', `${OTP_CODE} for ${WORKER.email}`);

  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login-verify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email: WORKER.email, otp: OTP_CODE }),
  });
  const loginData = await loginRes.json() as any;
  if (!loginRes.ok) {
    console.error('  ❌  Login failed:', loginData);
    await prisma.$disconnect();
    return;
  }
  const token = loginData.token as string;
  log('JWT received from server', token.slice(0, 30) + '...');
  log('Logged in as', loginData.user?.fullName);

  // ── 6. Call simulate-disruption → this runs through all 4 ML pillars ────────
  log('STEP 6: Calling /api/claim/simulate-disruption (full ML pipeline)');
  console.log();
  console.log('  ⏳  Running all 4 ML pillars...');
  console.log();

  const response = await fetch(`${BACKEND_URL}/api/claim/simulate-disruption`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  const result = await response.json() as any;

  if (!response.ok) {
    console.error('  ❌  API error:', result);
    await prisma.$disconnect();
    return;
  }

  // ── 7. Print full ML breakdown ────────────────────────────────────────────────
  const ml = result.mlBreakdown;
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                   ML ADJUDICATION RESULTS                 ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  PILLAR 1 — Bot Detection (IsolationForest)`);
  console.log(`║    Behavioral Score:     ${String(ml.pillar1Score?.toFixed(3)).padEnd(10)} (≥0.80 = human)`);
  console.log(`║`);
  console.log(`║  PILLAR 2 — Environmental Consensus (GBR on real weather)`);
  console.log(`║    Disruption Score:     ${String(ml.envDisruptionScore?.toFixed(3)).padEnd(10)} (≥0.30 = confirmed event)`);
  console.log(`║    Is Real Disruption:   ${ml.isRealDisruption ? '✅ YES' : '❌ NO (demo: claim still processed)'}`);
  console.log(`║    Evidence:             ${ml.evidence?.slice(0, 55)}`);
  console.log(`║`);
  console.log(`║  PILLAR 3 — Work-Proof (GBC + login_hour + chain)`);
  console.log(`║    Work Proof Score:     ${String(ml.pillar3Score?.toFixed(3)).padEnd(10)} (≥0.70 = genuine worker)`);
  console.log(`║    Active Minutes:       ${ml.activeMinutes}`);
  console.log(`║    IP Match:             ${ml.ipMatch ? '✅ YES' : '❌ NO'}`);
  console.log(`║    Chain Valid:          ${ml.isChainValid ? '✅ YES (HMAC chain intact)' : '❌ BROKEN'}`);
  console.log(`║    Recency:              ${ml.recencyMins} mins ago`);
  console.log(`║`);
  console.log(`║  PILLAR 4 — Fraud Ring (PyTorch GNN)`);
  console.log(`║    Ring Risk:            ${String(ml.pillar4RingRisk?.toFixed(3)).padEnd(10)} (≥0.65 = syndicate)`);
  console.log(`║`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  AGGREGATE SCORE`);
  console.log(`║    Trust Score:          ${ml.trustScore?.toFixed(4)}   (weights: P1×0.20 + P2×0.35 + P3×0.30 + P4×0.15)`);
  console.log(`║    Fraud Score:          ${ml.fraudScore?.toFixed(4)}`);
  console.log(`║    Aggregate Decision:   ${ml.aggregateDecision}`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  FINAL CLAIM DECISION:   ${result.claim?.status === 'PAID' ? '✅ PAID — INSTANT PAYOUT' : '⏳ UNDER REVIEW'}`);
  console.log(`║  Payout Amount:          ₹${result.claim?.payoutAmount ?? 0}`);
  console.log(`║  Claim ID:               ${result.claim?.id}`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Script failed:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
