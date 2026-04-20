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
import { JWT_SECRET } from '../config.js';

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
      // Uses centralized JWT_SECRET for consistency
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
      isChainValid,                                                // ← real HMAC result from above
      loginHour: latestSession ? new Date(latestSession.startTime).getHours() : undefined,
    });

    const ringWindowStart = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const nearbyClaims = await prisma.claim.findMany({
      where: {
        createdAt: { gte: ringWindowStart },
        user: { city: userCity },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,  // ← increased from 30 to handle Telegram-scale (500-worker) attacks
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
    const aqiValue = (consensus?.raw as any)?.aqi?.aqi || 0;
    const isRealDisruption = envDisruptionScore > 0.3;
    const isAQIHazard = aqiValue > 200;
    const triggerEventStr = isAQIHazard ? `AQI_HAZARD_DETECTION_${userCity.toUpperCase()}` : `STORM_CONSENSUS_DETECTION_${userCity.toUpperCase()}`;

    // Note: fraudScore < 0.45 is redundant — if trust >= 0.65 then fraud = 1 - trust <= 0.35.
    // The aggregate decision already encodes the threshold logic.
    const shouldAutoPay = isRealDisruption && aggregateDecision === 'PAID';
    const claimStatus = shouldAutoPay ? 'PAID' : 'REVIEW';

    // 🔒 Payout Idempotency Check
    // Prevent duplicate payouts for the same environmental event type within 24 hours.
    if (shouldAutoPay) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const duplicatePaidClaim = await prisma.claim.findFirst({
        where: {
          policyId: policy.id,
          triggerEvent: triggerEventStr,
          status: 'PAID',
          createdAt: { gte: twentyFourHoursAgo }
        }
      });

      if (duplicatePaidClaim) {
        res.status(429).json({ 
          error: 'Idempotency Triggered: A payout for this specific environmental event has already been processed today.' 
        });
        return;
      }
    }
    
    let claim = await prisma.claim.create({
      data: {
        userId,
        policyId: policy.id,
        triggerEvent: triggerEventStr,
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
            status: 'REVIEW' as any,
            payoutAmount: 0,
            reviewerNotes: `${claim.reviewerNotes || ''} | Payout pending manual review: ${message}`,
          },
        });
      }
    }

    // Update Trust Score after adjudication
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { trustScore: true } });
    if (currentUser) {
      let newTrust = currentUser.trustScore;
      if (claim.status === 'PAID' && fraudScore < 0.3) {
        newTrust = Math.min(1.0, newTrust + 0.05); // clean PAID claim → +5%
      } else if (fraudScore > 0.6) {
        newTrust = Math.max(0.0, newTrust - 0.10); // suspicious activity → -10%
      }
      await prisma.user.update({ where: { id: userId }, data: { trustScore: parseFloat(newTrust.toFixed(4)) } });
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
        isAQIHazard,
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

// Fetch Claim History — full list for /claims page
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const claims = await prisma.claim.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        policy: { select: { planTier: true, coverageAmount: true } }
      }
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claim history.' });
  }
});

// Fetch all claims — no limit (for full /claims page)
router.get('/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        policy: { select: { planTier: true, coverageAmount: true } }
      }
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all claims.' });
  }
});

// Fetch Payout History — only PAID claims with amounts > 0
router.get('/payouts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payouts = await prisma.claim.findMany({
      where: {
        userId: req.user!.userId,
        status: 'PAID',
        payoutAmount: { gt: 0 }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        policy: { select: { planTier: true } }
      }
    });

    const totalPaid = payouts.reduce((sum, p) => sum + (p.payoutAmount || 0), 0);

    res.json({ payouts, totalPaid, count: payouts.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payout history.' });
  }
});

// ── Mobile: fetch all claims for the authenticated user (Claims screen) ──────
router.get('/my-claims', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const claims = await prisma.claim.findMany({
      where:   { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: { policy: { select: { planTier: true, coverageAmount: true } } },
    });
    res.json({ claims });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims.' });
  }
});

// ── Mobile: map data — disruption zones + fraud clusters for the Map screen ──
/**
 * Returns:
 *  disruptionZones: confirmed disruption circles with lat/lon/radius for the city
 *  fraudClusters:   anonymised fraud ring cluster centroids
 *  activeWorkers:   count of workers with a session in the last 2h for the city
 */
router.get('/map-data', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const city = (req.query.city as string) || req.user!.city || 'Mumbai';

    // City → approximate coordinates (extend as needed)
    const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
      Mumbai:    { lat: 19.0760, lon: 72.8777 },
      Bengaluru: { lat: 12.9716, lon: 77.5946 },
      Delhi:     { lat: 28.6139, lon: 77.2090 },
      Chennai:   { lat: 13.0827, lon: 80.2707 },
      Hyderabad: { lat: 17.3850, lon: 78.4867 },
    };
    const base = CITY_COORDS[city] ?? CITY_COORDS.Mumbai;

    // 1. Environmental snapshot from ML service (non-blocking)
    let disruptionScore = 0;
    let disruptionLabel = 'Monitoring';
    try {
      const { default: axios } = await import('axios');
      const mlRes = await axios.post(
        `${process.env.ML_SERVICE_URL ?? 'http://127.0.0.1:8000'}/api/pillar2/environmental-consensus`,
        { city },
        { timeout: 8000 },
      );
      disruptionScore = mlRes.data?.disruptionScore ?? 0;
      const evidence: string[] = mlRes.data?.evidence ?? [];
      if (disruptionScore > 0.5) disruptionLabel = 'Severe Disruption';
      else if (disruptionScore > 0.3) disruptionLabel = evidence[0] ?? 'Disruption Detected';
    } catch { /* ML service unavailable — use empty zones */ }

    const disruptionZones = disruptionScore > 0.25
      ? [
          {
            id:           `dz-${city}-main`,
            city,
            lat:          base.lat,
            lon:          base.lon,
            radiusMeters: Math.round(1500 + disruptionScore * 4000),
            score:        disruptionScore,
            type:         'weather' as const,
            label:        disruptionLabel,
          },
        ]
      : [];

    // 2. Recent fraud ring clusters in this city (last 6h, grouped by subnet similarity)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentSuspectClaims = await prisma.claim.findMany({
      where: {
        createdAt:  { gte: sixHoursAgo },
        fraudScore: { gte: 0.55 },
        status:     'REVIEW',
        user:       { city },
      },
      select: { id: true, userId: true, fraudScore: true },
    });

    const fraudClusters = recentSuspectClaims.length >= 2
      ? [
          {
            id:        `fc-${city}-${sixHoursAgo.getTime()}`,
            lat:       base.lat + 0.014,
            lon:       base.lon + 0.018,
            count:     recentSuspectClaims.length,
            riskLevel: recentSuspectClaims.length >= 5 ? 'high' : 'medium' as 'high' | 'medium',
          },
        ]
      : [];

    // 3. Active worker count
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const activeWorkers = await prisma.workSession.count({
      where: {
        endTime: { gte: twoHoursAgo },
        user:    { city },
      },
    });

    res.json({ disruptionZones, fraudClusters, activeWorkers });
  } catch (error) {
    console.error('Map data error:', error);
    res.status(500).json({ error: 'Failed to fetch map data.' });
  }
});

export default router;
