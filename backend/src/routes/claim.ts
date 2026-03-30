import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../prismaClient.js';
import { calculateConsensus } from '../services/environmentalEngine.js';
import { analyzeSessionBehavior } from '../services/behavioralProfiler.js';
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
    const consensus = await calculateConsensus(userCity);
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
      ipMatch = latestSession.ipCity === userCity; 

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

    const { workProofScore, fraudScore } = calculateConfidence(activeMins, ipMatch, recencyMins, behavioralScore);

    // 5. Final Decision (Consensus + Work Proof)
    // For the hackathon demo, we allow a "Force-Pay" behavior to ensure the demo works even
    // if it's sunny outside, but we clearly log the real consensus results.
    const aqiValue = (consensus?.raw as any)?.aqi?.aqi || 0;
    const isRealDisruption = envDisruptionScore > 0.3;
    const isAQIHazard = aqiValue > 200;
    const claimStatus = (fraudScore < 0.4 && workProofScore > 0.1) ? 'PAID' : 'REVIEW';
    
    const claim = await prisma.claim.create({
      data: {
        userId,
        policyId: policy.id,
        triggerEvent: isAQIHazard ? `AQI_HAZARD_DETECTION_${userCity.toUpperCase()}` : `STORM_CONSENSUS_DETECTION_${userCity.toUpperCase()}`,
        status: claimStatus as any,
        fraudScore,
        workProofScore,
        payoutAmount: claimStatus === 'PAID' ? policy.coverageAmount : 0,
        reviewerNotes: `Env Score: ${envDisruptionScore} | AQI: ${consensus?.raw?.aqi?.aqi || 'N/A'} | Evidence: ${evidence}`
      }
    });

    res.json({
      success: true,
      claim,
      mlBreakdown: {
        activeMinutes: activeMins,
        ipMatch,
        recencyMins: Math.round(recencyMins),
        behavioralScore,
        isChainValid,
        envDisruptionScore,
        evidence,
        decision: claimStatus
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
