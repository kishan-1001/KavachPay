import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../prismaClient.js';
import { calculateConsensus } from '../services/environmentalEngine.js';
import { analyzeSessionBehavior } from '../services/behavioralProfiler.js';
import { initiateClaimPayout } from '../services/payoutService.js';
import {
  getAggregateScore,
  getPillar1BehavioralAuth,
  getPillar2Consensus,
  getPillar3SessionAuthenticity,
  getPillar4RingRisk,
} from '../services/mlClient.js';
import { creditTreasury, debitTreasury } from '../services/treasuryService.js';
import { isIpCityMatch } from '../services/ipIntel.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'kavach_pay_secret_zero_trust_2026';

const router = express.Router();

/**
 * 🧠 ML Confidence Score Calculation (Adjudication Logic)
 * 
 * This simulates the Model 2 & Model 3 from our README.
 */
function calculateConfidence(activeMinutes: number, ipMatch: boolean, sessionRecency: number, behavioralScore: number) {
  // 1. Work-Proof Score (0.0 - 1.0)
  const workProofScore = Math.min(activeMinutes / 30, 1.0);

  // 2. Fraud Score (0.0 - 1.0)
  let fraudScore = 0.05; 
  if (!ipMatch) fraudScore += 0.5; 
  if (sessionRecency > 30) fraudScore += 0.3; // Increased window to 30 mins
  
  // 3. Behavioral Guard (Pillar 1)
  // If behavioral score is low (Bot detected), we drastically increase fraud score
  const behavioralRisk = 1 - behavioralScore;
  fraudScore += (behavioralRisk * 0.8);

  return { 
    workProofScore: parseFloat(workProofScore.toFixed(2)), 
    fraudScore: parseFloat(Math.min(fraudScore, 1.0).toFixed(2)) 
  };
}

// SIMULATE DISRUPTION (The Hackathon Presentation Engine 🚀)
router.post('/simulate-disruption', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userCity = req.user!.city;

    // 1. Fetch User and Active Policy
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        policies: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user || user.policies.length === 0) {
      res.status(403).json({ error: 'No active policy found. Purchase a plan first.' });
      return;
    }

    const policy = user.policies[0];

    // 2. Fetch Latest Work-Proof Session (Step 3) with full Audit Trail
    const latestSession = await prisma.workSession.findFirst({
      where: { userId: userId },
      orderBy: { startTime: 'desc' },
      include: { heartbeats: { orderBy: { timestamp: 'asc' } } }
    });

    // 3. REAL-WORLD ENVIRONMENTAL CONSENSUS (Pillar 2)
    const mlPillar2 = await getPillar2Consensus(userCity);
    const consensus = mlPillar2
      ? {
          disruptionScore: mlPillar2.disruptionScore,
          evidence: mlPillar2.evidence.join(' | '),
          raw: mlPillar2.raw as any,
        }
      : await calculateConsensus(userCity);

    const envDisruptionScore = consensus?.disruptionScore || 0.05;
    const evidence = consensus?.evidence || 'No real-time disruption data available.';

    // 4. Run ML Adjudication + Cryptographic Audit (Step 5)
    let activeMins = 0;
    let ipMatch = false;
    let recencyMins = 999;
    let behavioralScore = 1.0;
    let isChainValid = true;

    if (latestSession && latestSession.heartbeats.length > 0) {
      activeMins = latestSession.activeMinutes;
      
      // Audit the IP of the LAST heartbeat (most accurate location)
      const lastHeartbeat = latestSession.heartbeats[latestSession.heartbeats.length - 1];
      ipMatch = isIpCityMatch(latestSession.ipCity, userCity);

      recencyMins = (new Date().getTime() - new Date(lastHeartbeat.timestamp).getTime()) / 60000;

      // PILLAR 1: Behavioral Analysis
      const behaviorReport = await analyzeSessionBehavior(latestSession.id);
      behavioralScore = behaviorReport.score;

      // PILLAR 3: Cryptographic Audit of the entire chain
      // We re-calculate every single hash in the chain using the recorded IP of each minute
      let runningHash = '';
      for (let i = 0; i < latestSession.heartbeats.length; i++) {
        const hb = latestSession.heartbeats[i];
        const hbMins = i + 1;
        const dataStr = `${userId}-${hbMins}-${hb.ipAddress}-${latestSession.startTime.toISOString()}`;
        
        const expectedHash = crypto
          .createHmac('sha256', JWT_SECRET)
          .update(dataStr + runningHash)
          .digest('hex');
        
        if (expectedHash !== hb.hash) {
          isChainValid = false;
          break;
        }
        runningHash = expectedHash;
      }
    }

    if (!isChainValid) behavioralScore = 0.1; // Mark as faked if chain is broken

    const localConfidence = calculateConfidence(activeMins, ipMatch, recencyMins, behavioralScore);

    const heartbeatTimestamps = latestSession?.heartbeats.map((hb) => hb.timestamp.toISOString()) || [];
    const mlPillar1 = await getPillar1BehavioralAuth(heartbeatTimestamps);

    const mlPillar3 = await getPillar3SessionAuthenticity({
      userId,
      sessionStartTime: latestSession?.startTime.toISOString() || new Date().toISOString(),
      registeredCity: userCity,
      observedIpCity: latestSession?.ipCity || undefined,
      heartbeats:
        latestSession?.heartbeats.map((hb) => ({
          timestamp: hb.timestamp.toISOString(),
          ipAddress: hb.ipAddress,
          hash: hb.hash,
        })) || [],
    });

    const ringWindowStart = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const nearbyClaims = await prisma.claim.findMany({
      where: {
        createdAt: { gte: ringWindowStart },
        user: { city: userCity },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        userId: true,
        createdAt: true,
        workProofScore: true,
      },
    });

    const uniqueUserIds = Array.from(new Set(nearbyClaims.map((c) => c.userId)));
    const latestSessionsByUser = await Promise.all(
      uniqueUserIds.map(async (claimUserId) => {
        const session = await prisma.workSession.findFirst({
          where: { userId: claimUserId },
          orderBy: { startTime: 'desc' },
          select: { userId: true, ipAddress: true },
        });
        return session;
      })
    );

    const ipByUser = new Map<string, string>();
    for (const session of latestSessionsByUser) {
      if (session) {
        ipByUser.set(session.userId, session.ipAddress);
      }
    }

    const ringPayload = nearbyClaims.map((claimNode) => ({
      userId: claimNode.userId,
      timestamp: claimNode.createdAt.toISOString(),
      ipAddress: ipByUser.get(claimNode.userId) || '127.0.0.1',
      workProofScore: claimNode.workProofScore ?? 0,
    }));

    const mlPillar4 = await getPillar4RingRisk(ringPayload);

    const pillar1Score = mlPillar1?.score ?? behavioralScore;
    const pillar2Score = envDisruptionScore;
    const pillar3Score = mlPillar3?.score ?? localConfidence.workProofScore;
    const pillar4RingRisk = mlPillar4?.ringRisk ?? 0;

    const mlAggregate = await getAggregateScore({
      pillar1Score,
      pillar2Score,
      pillar3Score,
      pillar4RingRisk,
    });

    const fallbackTrust =
      pillar1Score * 0.25 + pillar2Score * 0.3 + pillar3Score * 0.3 + (1 - pillar4RingRisk) * 0.15;
    const trustScore = mlAggregate?.trustScore ?? Number(Math.max(0, Math.min(1, fallbackTrust)).toFixed(4));
    const fraudScore = mlAggregate?.fraudScore ?? Number((1 - trustScore).toFixed(4));
    const aggregateDecision = mlAggregate?.decision ?? (trustScore >= 0.65 ? 'PAID' : 'REVIEW');

    const effectiveChainValid = isChainValid && (mlPillar3?.isChainValid ?? true);
    const effectiveIpMatch = mlPillar3?.ipMatch ?? ipMatch;
    const effectiveRecency = mlPillar3?.recencyMins ?? recencyMins;

    // 5. Final Decision (Consensus + Work Proof)
    // For the hackathon demo, we allow a "Force-Pay" behavior to ensure the demo works even
    // if it's sunny outside, but we clearly log the real consensus results.
    const aqiValue = (consensus?.raw as any)?.aqi?.aqi || 0;
    const isRealDisruption = envDisruptionScore > 0.3;
    const isAQIHazard = aqiValue > 200;
    const shouldAutoPay = isRealDisruption && aggregateDecision === 'PAID' && fraudScore < 0.45;
    const claimStatus = shouldAutoPay ? 'PAID' : 'REVIEW';
    
    let claim = await prisma.claim.create({
      data: {
        userId,
        policyId: policy.id,
        triggerEvent: isAQIHazard ? `AQI_HAZARD_DETECTION_${userCity.toUpperCase()}` : `STORM_CONSENSUS_DETECTION_${userCity.toUpperCase()}`,
        status: claimStatus as any,
        fraudScore,
        workProofScore: pillar3Score,
        behavioralScore: pillar1Score,
        isChainValid: effectiveChainValid,
        payoutAmount: shouldAutoPay ? policy.coverageAmount : 0,
        reviewerNotes:
          `Env Score: ${envDisruptionScore.toFixed(3)} | Trust: ${trustScore.toFixed(3)} | Fraud: ${fraudScore.toFixed(3)} | ` +
          `P1: ${pillar1Score.toFixed(3)} P2: ${pillar2Score.toFixed(3)} P3: ${pillar3Score.toFixed(3)} P4Risk: ${pillar4RingRisk.toFixed(3)} | ` +
          `AQI: ${consensus?.raw?.aqi?.aqi || 'N/A'} | Evidence: ${evidence}`
      }
    });

    if (shouldAutoPay && claim.payoutAmount && claim.payoutAmount > 0) {
      try {
        await debitTreasury({
          amount: claim.payoutAmount,
          type: 'PAYOUT',
          referenceType: 'CLAIM',
          referenceId: claim.id,
          note: `Claim payout reserved for ${userId}`,
          createdByUserId: userId,
        });

        const payoutResult = await initiateClaimPayout({
          claimId: claim.id,
          userId,
          amountRupees: claim.payoutAmount,
          upiId: user.upiId || undefined,
        });

        claim = await prisma.claim.update({
          where: { id: claim.id },
          data: {
            razorpayPayoutId: payoutResult.payoutId || null,
            reviewerNotes: `${claim.reviewerNotes || ''} | Payout: ${payoutResult.message}`,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown payout error';

        if (claim.payoutAmount && claim.payoutAmount > 0) {
          await creditTreasury({
            amount: claim.payoutAmount,
            type: 'ADJUSTMENT',
            referenceType: 'CLAIM',
            referenceId: claim.id,
            note: `Rollback treasury debit due to payout failure: ${message}`,
            createdByUserId: userId,
          });
        }

        claim = await prisma.claim.update({
          where: { id: claim.id },
          data: {
            status: 'REVIEW',
            payoutAmount: 0,
            reviewerNotes: `${claim.reviewerNotes || ''} | Payout pending manual review: ${message}`,
          },
        });
      }
    }

    res.json({
      success: true,
      claim,
      mlBreakdown: {
        activeMinutes: activeMins,
        ipMatch: effectiveIpMatch,
        recencyMins: Math.round(effectiveRecency),
        behavioralScore: pillar1Score,
        isChainValid: effectiveChainValid,
        envDisruptionScore,
        isRealDisruption,
        pillar1Score,
        pillar2Score,
        pillar3Score,
        pillar4RingRisk,
        trustScore,
        fraudScore,
        aggregateDecision,
        evidence,
        decision: claim.status
      }
    });

  } catch (error) {
    console.error('Simulation Error:', error);
    res.status(500).json({ error: 'Failed to process AI adjudication.' });
  }
});

// Fetch Claim History for Dashboard
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim history.' });
  }
});

export default router;
