import crypto from 'crypto';
import prisma from '../src/prismaClient.js';
import { analyzeSessionBehavior } from '../src/services/behavioralProfiler.js';
import { initiateClaimPayout } from '../src/services/payoutService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function calculateConfidence(
  activeMinutes: number,
  ipMatch: boolean,
  sessionRecencyMins: number,
  behavioralScore: number
) {
  // Mirror the logic from `backend/src/routes/claim.ts`.
  const workProofScore = Math.min(activeMinutes / 30, 1.0);

  let fraudScore = 0.05;
  if (!ipMatch) fraudScore += 0.5;
  if (sessionRecencyMins > 30) fraudScore += 0.3;

  const behavioralRisk = 1 - behavioralScore;
  fraudScore += behavioralRisk * 0.8;

  return {
    workProofScore: parseFloat(workProofScore.toFixed(2)),
    fraudScore: parseFloat(Math.min(fraudScore, 1.0).toFixed(2)),
  };
}

async function main() {
  const nowMs = Date.now();
  const userEmail = `smoketest_${nowMs}@example.com`;
  const userCity = 'Bengaluru';
  const deliveryPlatform = 'Zomato';
  const vehicleType = 'Two-wheeler';
  const weeklyEarnings = 5000;

  // Scenario requested: worker stayed active for 30 minutes.
  const heartbeatsCount = 30;
  const lastHeartbeatRecencyMins = 2; // fresh session

  // Create human-like jitter:
  // intervals between heartbeats (ms)
  const intervalsMs: number[] = [];
  for (let i = 0; i < heartbeatsCount - 1; i++) {
    const jitter = (i % 5) * 180 - 360; // deterministic jitter in [-360, 360]
    intervalsMs.push(60000 + jitter);
  }
  const offsetsMs: number[] = [0];
  for (let i = 0; i < intervalsMs.length; i++) {
    offsetsMs.push(offsetsMs[i] + intervalsMs[i]);
  }

  const totalSpanMs = offsetsMs[offsetsMs.length - 1];
  const startTime = new Date(nowMs - lastHeartbeatRecencyMins * 60000 - totalSpanMs);
  const ipAddress = '103.116.14.22'; // mock "Bengaluru-like" IP

  // --------- Create user + policy (so claim has something to attach to) ----------
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      fullName: 'Smoke Test Worker',
      email: userEmail,
      city: userCity,
      deliveryPlatform,
      vehicleType,
      weeklyEarnings,
      phoneNumber: '9999999999',
      upiId: 'smoketest@upi',
      isVerified: true,
    },
  });

  // Hackathon testing: free BASIC policy for zero-rupee premium path.
  const policy = await prisma.policy.create({
    data: {
      userId: user.id,
      planTier: 'BASIC',
      status: 'ACTIVE',
      coverageAmount: 1500,
      premiumPaid: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // --------- Build the WorkSession + heartbeat chain hashes ----------
  let runningHash = '';
  const heartbeatHashes: string[] = [];
  for (let i = 0; i < heartbeatsCount; i++) {
    const hbMins = i + 1;
    const dataStr = `${user.id}-${hbMins}-${ipAddress}-${startTime.toISOString()}`;
    const expectedHash = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(dataStr + runningHash)
      .digest('hex');
    heartbeatHashes.push(expectedHash);
    runningHash = expectedHash;
  }

  const sessionHash = heartbeatHashes[heartbeatHashes.length - 1];
  const previousSessionHash = heartbeatHashes.length >= 2 ? heartbeatHashes[heartbeatHashes.length - 2] : null;

  const heartbeatsData = offsetsMs.map((offset, idx) => {
    const timestamp = new Date(startTime.getTime() + offset);
    return {
      ipAddress,
      timestamp,
      hash: heartbeatHashes[idx],
    };
  });

  const session = await prisma.workSession.create({
    data: {
      userId: user.id,
      startTime,
      activeMinutes: heartbeatsCount,
      ipAddress,
      ipCity: userCity,
      platformActiveFlag: true,
      sessionHash,
      previousSessionHash,
      heartbeats: {
        create: heartbeatsData,
      },
    },
    include: { heartbeats: true },
  });

  // Pillar 1: behavioral/jitter score
  const behaviorReport = await analyzeSessionBehavior(session.id);

  // Pillar 3a: IP-city match gate
  const ipMatch = session.ipCity === userCity;

  // Pillar 3b: re-audit the whole chain (same logic as claim route)
  const orderedHeartbeats = [...session.heartbeats].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  let chainRunning = '';
  let isChainValid = true;
  for (let i = 0; i < orderedHeartbeats.length; i++) {
    const hb = orderedHeartbeats[i];
    const hbMins = i + 1;
    const dataStr = `${user.id}-${hbMins}-${hb.ipAddress}-${session.startTime.toISOString()}`;
    const expectedHash = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(dataStr + chainRunning)
      .digest('hex');
    if (expectedHash !== hb.hash) {
      isChainValid = false;
      break;
    }
    chainRunning = expectedHash;
  }

  const lastHeartbeat = orderedHeartbeats[orderedHeartbeats.length - 1];
  const recencyMins = (Date.now() - lastHeartbeat.timestamp.getTime()) / 60000;

  const { workProofScore, fraudScore } = calculateConfidence(
    session.activeMinutes,
    ipMatch,
    recencyMins,
    behaviorReport.score
  );

  // Forced rainstorm event for deterministic test-mode adjudication.
  const envDisruptionScore = 0.92;
  const isRealDisruption = envDisruptionScore > 0.3;

  const claimStatus = isRealDisruption && fraudScore < 0.4 && workProofScore > 0.1 ? 'PAID' : 'REVIEW';
  const payoutAmount = claimStatus === 'PAID' ? policy.coverageAmount : 0;

  const claim = await prisma.claim.create({
    data: {
      userId: user.id,
      policyId: policy.id,
      triggerEvent: `STORM_CONSENSUS_DETECTION_${userCity.toUpperCase()}`,
      status: claimStatus as any,
      fraudScore,
      workProofScore,
      behavioralScore: behaviorReport.score,
      isChainValid,
      payoutAmount,
      reviewerNotes: `Forced rainstorm smoke test. Env score=${envDisruptionScore}; behavioral stddev=${behaviorReport.jitterMs}ms`,
    },
  });

  let payoutMessage = 'No payout attempt (claim not paid).';
  let payoutId: string | undefined;
  if (claimStatus === 'PAID' && payoutAmount > 0) {
    const payoutResult = await initiateClaimPayout({
      claimId: claim.id,
      userId: user.id,
      amountRupees: payoutAmount,
      upiId: user.upiId || undefined,
    });

    payoutMessage = payoutResult.message;
    payoutId = payoutResult.payoutId;

    await prisma.claim.update({
      where: { id: claim.id },
      data: {
        razorpayPayoutId: payoutResult.payoutId || null,
        reviewerNotes: `${claim.reviewerNotes || ''} | Payout: ${payoutResult.message}`,
      }
    });
  }

  // --------- Print the evaluation summary ----------
  console.log('--- Gig Worker Smoke Test Output ---');
  console.log({
    userId: user.id,
    policyId: policy.id,
    sessionId: session.id,
    heartbeatsCount,
    pillar1_behavior: {
      score: behaviorReport.score,
      isBot: behaviorReport.isBot,
      jitterMs: behaviorReport.jitterMs,
      confidence: behaviorReport.confidence,
    },
    pillar3: {
      ipMatch,
      isChainValid,
    },
    pillar_workProof: {
      activeMinutes: session.activeMinutes,
      workProofScore,
      recencyMins: Math.round(recencyMins),
    },
    decision: {
      fraudScore,
      envDisruptionScore,
      isRealDisruption,
      status: claimStatus,
      payoutAmount,
      claimId: claim.id,
    },
    payout: {
      mode: (process.env.PAYOUT_MODE || 'mock').toLowerCase(),
      payoutId: payoutId || null,
      message: payoutMessage,
    }
  });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Smoke test failed:', e);
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

