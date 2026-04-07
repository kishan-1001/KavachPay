/**
 * ❌ SCRIPT 2: SUSPICIOUS / FRAUD SESSION
 * ==========================================
 * Simulates a GPS-spoofer / bot from a fraud ring:
 *  - Logs in at 3 AM (off-hours — not a delivery window)
 *  - Only 3 heartbeats (barely active, AFK)
 *  - Near-zero jitter (bot-like precision — exactly 60.000s intervals)
 *  - IP address doesn't match registered city (registered=Bengaluru, IP=Mumbai)
 *  - Hash chain is deliberately BROKEN (tampered IP in heartbeat #2)
 *  - Part of a fake cluster — 5 "workers" all on same /24 subnet + same minute
 *
 * Expected result: LOW trust, HIGH fraud → UNDER REVIEW
 *
 * Run: npx tsx scripts/test_fraud_session.ts
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import crypto from 'crypto';
import prisma from '../src/prismaClient.js';

const BACKEND_URL = 'http://localhost:5000';
const JWT_SECRET  = process.env.JWT_SECRET || 'kavach_pay_secret_zero_trust_2026';

// ─── Config ────────────────────────────────────────────────────────────────────

const FRAUDSTER = {
  fullName:         'Fake Worker (Bot)',
  email:            `fraud_worker_${Date.now()}@kavachtest.com`,
  city:             'Bengaluru',            // Registered city: Bengaluru
  deliveryPlatform: 'Zomato',
  vehicleType:      'Two-wheeler',
  weeklyEarnings:   5000,
  upiId:            'fraud.worker@upi',
  phoneNumber:      '9000000001',
};

const HEARTBEATS      = 3;       // Only 3 minutes active — barely qualifies
const RECENCY_MINS    = 90;      // Last heartbeat was 90 mins ago — stale session
const IP_ADDRESS_REAL = '49.36.195.10'; // Mumbai IP — MISMATCHES Bengaluru registration
const IP_ADDRESS_FAKE = '10.8.4.55';    // Injected fake IP in heartbeat #2 — breaks chain
const IP_CITY         = 'Mumbai';        // IP resolves to Mumbai, not Bengaluru
const LOGIN_HOUR      = 3;       // 3 AM — not a delivery hour

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(label: string, value?: unknown) {
  if (value === undefined) {
    console.log(`\n${'─'.repeat(60)}\n  ${label}\n${'─'.repeat(60)}`);
  } else {
    console.log(`  ${label.padEnd(32)}`, value);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔴  FRAUD / BOT SESSION SIMULATION — KavachPay ML Test');
  console.log('════════════════════════════════════════════════════════\n');
  console.log('  Setting up a session with these red flags:');
  console.log('  ❌  Login at 3 AM (off-peak, not a delivery hour)');
  console.log('  ❌  Only 3 heartbeats (barely any session activity)');
  console.log('  ❌  Zero jitter — bot-precise 60.000s intervals');
  console.log('  ❌  IP city (Mumbai) mismatches registered city (Bengaluru)');
  console.log('  ❌  Hash chain DELIBERATELY BROKEN (tampered IP in heartbeat #2)');
  console.log('  ❌  Part of a fake 5-worker cluster on same subnet\n');

  // ── 1. Create user + policy ─────────────────────────────────────────────────
  log('STEP 1: Creating fraudster profile in DB');

  const user = await prisma.user.upsert({
    where:  { email: FRAUDSTER.email },
    update: {},
    create: {
      ...FRAUDSTER,
      weeklyEarnings: FRAUDSTER.weeklyEarnings,
      isVerified: true,
      trustScore: 0.5,
    },
  });
  log('User created', user.id);
  log('Registered city', user.city + ' ← registered here');
  log('IP city (spoofed)', IP_CITY + ' ← real IP resolves here (MISMATCH)');

  const policy = await prisma.policy.create({
    data: {
      userId:         user.id,
      planTier:       'BASIC',
      status:         'ACTIVE',
      coverageAmount: 1500,
      premiumPaid:    35,
      startDate:      new Date(),
      endDate:        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  log('Policy created', policy.id);

  // ── 2. Build session timestamps at 3 AM ────────────────────────────────────
  log('STEP 2: Building suspicious session at 3 AM with bot-precise timing');

  const now      = new Date();
  const lastHbAt = new Date(now.getTime() - RECENCY_MINS * 60_000);

  // Bot timing: EXACTLY 60 seconds, zero jitter
  const botIntervalMs = 60_000;
  const startTime = new Date(lastHbAt.getTime() - (HEARTBEATS - 1) * botIntervalMs);

  // Force startTime to be 3 AM regardless of actual time
  startTime.setHours(LOGIN_HOUR, 0, 0, 0);
  const timestamps = Array.from({ length: HEARTBEATS }, (_, i) =>
    new Date(startTime.getTime() + i * botIntervalMs)
  );

  log('Session start time', `${startTime.toLocaleTimeString()} (LOGIN_HOUR=${LOGIN_HOUR})`);
  log('Heartbeat count', `${HEARTBEATS} (very low — minimum activity)`);
  log('Jitter', '0ms — exactly 60.000s between each heartbeat (robot-precise)');
  log('Recency', `${RECENCY_MINS} mins ago (stale session)`);

  // ── 3. Build a DELIBERATELY BROKEN chain ───────────────────────────────────
  log('STEP 3: Building hash chain — then BREAKING it at heartbeat #2');

  // Heartbeat #1: valid hash using real IP
  const hash1DataStr = `${user.id}-1-${IP_ADDRESS_REAL}-${startTime.toISOString()}`;
  const hash1 = crypto.createHmac('sha256', JWT_SECRET).update(hash1DataStr).digest('hex');

  // Heartbeat #2: DELIBERATELY uses a FAKE IP in the data string
  // This simulates a spoofer who tried to change the IP in the record
  const hash2DataStr_FAKE = `${user.id}-2-${IP_ADDRESS_FAKE}-${startTime.toISOString()}`;
  const hash2 = crypto.createHmac('sha256', JWT_SECRET).update(hash2DataStr_FAKE + hash1).digest('hex');
  // ↑ hash2 is computed with FAKE IP, but we'll store the REAL IP in the DB
  // When claim.ts re-computes it with REAL IP, the hashes won't match → BROKEN

  // Heartbeat #3: continues from broken chain
  const hash3DataStr = `${user.id}-3-${IP_ADDRESS_REAL}-${startTime.toISOString()}`;
  const hash3 = crypto.createHmac('sha256', JWT_SECRET).update(hash3DataStr + hash2).digest('hex');

  const hashes = [hash1, hash2, hash3];

  log('Hash chain', 'Built with tampered IP in heartbeat #2');
  log('hash1', hash1.slice(0, 20) + '... (valid)');
  log('hash2', hash2.slice(0, 20) + '... (POISONED — wrong IP used)');
  log('hash3', hash3.slice(0, 20) + '... (downstream of broken link)');

  // Verify chain WILL be broken when backend re-computes it
  let chainCheck = '';
  let isChainValid = true;
  for (let i = 0; i < HEARTBEATS; i++) {
    // Backend always uses the STORED ipAddress (IP_ADDRESS_REAL), not the fake one
    const dataStr   = `${user.id}-${i + 1}-${IP_ADDRESS_REAL}-${startTime.toISOString()}`;
    const expected  = crypto.createHmac('sha256', JWT_SECRET).update(dataStr + chainCheck).digest('hex');
    if (expected !== hashes[i]) {
      isChainValid = false;
      log('Chain break detected at heartbeat', `#${i + 1} ← backend will catch this`);
      break;
    }
    chainCheck = expected;
  }
  log('Pre-verification result', isChainValid ? '✅ valid (bug: should be broken)' : '❌ BROKEN — backend will detect');

  // ── 4. Persist session to DB ────────────────────────────────────────────────
  log('STEP 4: Writing suspicious session to database');

  const session = await prisma.workSession.create({
    data: {
      userId:             user.id,
      startTime,
      endTime:            timestamps[HEARTBEATS - 1],
      activeMinutes:      HEARTBEATS,
      ipAddress:          IP_ADDRESS_REAL,
      ipCity:             IP_CITY,       // Mumbai — mismatches Bengaluru registration
      platformActiveFlag: false,         // No delivery platform activity
      sessionHash:        hashes[HEARTBEATS - 1],
      previousSessionHash: hashes[HEARTBEATS - 2],
      heartbeats: {
        create: timestamps.map((ts, i) => ({
          timestamp: ts,
          ipAddress: IP_ADDRESS_REAL,   // Stored as real IP — backend will recompute hash with this
          hash:      hashes[i],          // hash[1] was computed with fake IP → mismatch
        })),
      },
    },
    include: { heartbeats: { orderBy: { timestamp: 'asc' } } },
  });
  log('Session created', session.id);
  log('Active minutes', `${session.activeMinutes} (≪ 45 min threshold)`);
  log('IP city stored', `${session.ipCity} (registered: ${user.city})`);
  log('IP match', session.ipCity === user.city ? '✅ (unexpected)' : '❌ MISMATCH — different cities');

  // ── 5. Create decoy cluster (simulates Telegram fraud ring) ────────────────
  log('STEP 5: Seeding a fake fraud ring cluster (same subnet, same minute)');

  const ringClusterSize = 5;
  const claimMinute = new Date();
  claimMinute.setSeconds(0, 0);

  for (let i = 0; i < ringClusterSize; i++) {
    const ringUser = await prisma.user.upsert({
      where:  { email: `ring_member_${Date.now()}_${i}@kavachtest.com` },
      update: {},
      create: {
        fullName:         `Ring Bot #${i}`,
        email:            `ring_member_${Date.now()}_${Math.random()}@kavachtest.com`,
        city:             'Bengaluru',
        deliveryPlatform: 'Zomato',
        vehicleType:      'Two-wheeler',
        weeklyEarnings:   5000,
        phoneNumber:      `900000000${i}`,
        isVerified:       true,
      },
    });

    const ringPolicy = await prisma.policy.create({
      data: {
        userId:         ringUser.id,
        planTier:       'BASIC',
        status:         'ACTIVE',
        coverageAmount: 1500,
        premiumPaid:    0,
        startDate:      new Date(),
        endDate:        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // All ring members: same /24 subnet (10.8.4.*), same work proof score, same minute
    await prisma.claim.create({
      data: {
        userId:         ringUser.id,
        policyId:       ringPolicy.id,
        triggerEvent:   'STORM_CONSENSUS_DETECTION_BENGALURU',
        status:         'REVIEW',
        fraudScore:     0.75,
        workProofScore: 0.31,   // identical bot work scores
        behavioralScore: 0.30,
        isChainValid:   false,
        payoutAmount:   0,
        createdAt:      claimMinute,
        reviewerNotes:  `Ring member ${i} — seeded for P4 GNN test`,
      },
    });

    await prisma.workSession.create({
      data: {
        userId:             ringUser.id,
        startTime:          new Date(claimMinute.getTime() - 3 * 60_000),
        endTime:            claimMinute,
        activeMinutes:      3,
        ipAddress:          `10.8.4.${50 + i}`,   // same /24 subnet — 10.8.4.*
        ipCity:             'Mumbai',
        platformActiveFlag: false,
        sessionHash:        `fakehash${i}`,
        heartbeats:         { create: [{ timestamp: claimMinute, ipAddress: `10.8.4.${50 + i}`, hash: `fakehash${i}` }] },
      },
    });
  }
  log('Ring cluster seeded', `${ringClusterSize} bots on subnet 10.8.4.* all at same minute`);

  // ── 6. Get a real JWT from the server via seeded OTP ───────────────────────
  log('STEP 6: Getting a real JWT from the server via login flow');

  const OTP_CODE = '111111';
  await prisma.otpVerification.deleteMany({ where: { email: FRAUDSTER.email } });
  await prisma.otpVerification.create({
    data: {
      email:     FRAUDSTER.email,
      otpCode:   OTP_CODE,
      expiresAt: new Date(Date.now() + 5 * 60_000),
      verified:  false,
    },
  });
  log('OTP seeded', `${OTP_CODE} for ${FRAUDSTER.email}`);

  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login-verify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email: FRAUDSTER.email, otp: OTP_CODE }),
  });
  const loginData = await loginRes.json() as any;
  if (!loginRes.ok) {
    console.error('  ❌  Login failed:', loginData);
    await prisma.$disconnect();
    return;
  }
  const token = loginData.token as string;
  log('JWT received from server', token.slice(0, 30) + '...');

  // ── 7. Call simulate-disruption — full ML pipeline runs here ────────────────
  log('STEP 7: Calling /api/claim/simulate-disruption (full ML pipeline)');
  console.log();
  console.log('  ⏳  Running all 4 ML pillars on this suspicious session...\n');

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

  // ── 7. Print results ─────────────────────────────────────────────────────────
  const ml = result.mlBreakdown;
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                   ML ADJUDICATION RESULTS                 ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  PILLAR 1 — Bot Detection (IsolationForest)`);
  console.log(`║    Behavioral Score:     ${String(ml.pillar1Score?.toFixed(3)).padEnd(10)} ${ml.pillar1Score < 0.5 ? '❌ BOT-LIKE TIMING' : '⚠️ borderline'}`);
  console.log(`║    (0ms jitter + 3AM login should flag this)`);
  console.log(`║`);
  console.log(`║  PILLAR 2 — Environmental Consensus (real weather)`);
  console.log(`║    Disruption Score:     ${String(ml.envDisruptionScore?.toFixed(3)).padEnd(10)} (≥0.30 needed)`);
  console.log(`║    Is Real Disruption:   ${ml.isRealDisruption ? '✅ YES' : '❌ NO — no real weather event'}`);
  console.log(`║    Evidence:             ${ml.evidence?.slice(0, 55)}`);
  console.log(`║`);
  console.log(`║  PILLAR 3 — Work-Proof (GBC + login_hour + chain)`);
  console.log(`║    Work Proof Score:     ${String(ml.pillar3Score?.toFixed(3)).padEnd(10)} ${ml.pillar3Score < 0.5 ? '❌ LOW' : '⚠️'}`);
  console.log(`║    Active Minutes:       ${ml.activeMinutes} (threshold: 45 mins)`);
  console.log(`║    IP Match:             ${ml.ipMatch ? '✅' : '❌ MISMATCH — Mumbai IP / Bengaluru registration'}`);
  console.log(`║    Chain Valid:          ${ml.isChainValid ? '✅' : '❌ BROKEN — backend detected tampered hash'}`);
  console.log(`║    Recency:              ${ml.recencyMins} mins ago (>30 = stale)`);
  console.log(`║`);
  console.log(`║  PILLAR 4 — Fraud Ring GNN (across last 6h in city)`);
  console.log(`║    Ring Risk:            ${String(ml.pillar4RingRisk?.toFixed(3)).padEnd(10)} ${ml.pillar4RingRisk >= 0.65 ? '❌ FRAUD RING DETECTED' : '⚠️ partial signal'}`);
  console.log(`║    (5 bots on same subnet 10.8.4.* seeded above)`);
  console.log(`║`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  AGGREGATE SCORE`);
  console.log(`║    Trust Score:          ${ml.trustScore?.toFixed(4)}   (threshold: 0.65 for PAID)`);
  console.log(`║    Fraud Score:          ${ml.fraudScore?.toFixed(4)}`);
  console.log(`║    Aggregate Decision:   ${ml.aggregateDecision}`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  FINAL CLAIM DECISION:   ${result.claim?.status === 'PAID' ? '❌ WRONGLY PAID (investigate!)' : '✅ UNDER REVIEW — fraud correctly flagged'}`);
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
