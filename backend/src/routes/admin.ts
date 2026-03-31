import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import prisma from '../prismaClient.js';
import { creditTreasury, debitTreasury, getTreasurySummary, getTreasuryTransactions } from '../services/treasuryService.js';
import { initiateClaimPayout } from '../services/payoutService.js';

const router = express.Router();

// GET /api/admin/stats - Global Dashboard Overview
router.get('/stats', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activePolicies = await prisma.policy.count({ where: { status: 'ACTIVE' } });
    
    const premiumAgg = await prisma.policy.aggregate({
      _sum: { premiumPaid: true }
    });
    
    const payoutAgg = await prisma.claim.aggregate({
      _sum: { payoutAmount: true }
    });

    const highRiskClaims = await prisma.claim.count({
      where: { fraudScore: { gte: 0.6 } }
    });

    const totalClaims = await prisma.claim.count();
    const fraudRate = totalClaims > 0 ? (highRiskClaims / totalClaims) * 100 : 0;
    const treasurySummary = await getTreasurySummary();

    res.json({
      totalUsers,
      activePolicies,
      totalPremiumCollected: premiumAgg._sum.premiumPaid || 0,
      totalPayouts: payoutAgg._sum.payoutAmount || 0,
      fraudRate: parseFloat(fraudRate.toFixed(2)),
      highRiskClaims,
      treasury: {
        balance: treasurySummary.treasury.balance,
        currency: treasurySummary.treasury.currency,
        inflow: treasurySummary.totals.inflow,
        outflow: treasurySummary.totals.outflow,
        transactions: treasurySummary.totals.transactions,
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics.' });
  }
});

// GET /api/admin/treasury - Treasury summary + latest transactions
router.get('/treasury', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const summary = await getTreasurySummary();
    const transactions = await getTreasuryTransactions(25);

    res.json({
      balance: summary.treasury.balance,
      currency: summary.treasury.currency,
      inflow: summary.totals.inflow,
      outflow: summary.totals.outflow,
      transactionsCount: summary.totals.transactions,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch treasury data.' });
  }
});

// POST /api/admin/treasury/topup - Add fake demo funds
router.post('/treasury/topup', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const amount = Number(req.body?.amount || 0);
    const note = String(req.body?.note || 'Manual treasury top-up from admin panel');

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Top-up amount must be a positive number.' });
      return;
    }

    const treasury = await creditTreasury({
      amount: Math.round(amount),
      type: 'TOPUP',
      referenceType: 'ADMIN_TOPUP',
      referenceId: req.user?.userId,
      note,
      createdByUserId: req.user?.userId,
    });

    res.json({ success: true, balance: treasury.balance, message: 'Treasury topped up successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to top up treasury.' });
  }
});

// GET /api/admin/claims - Detailed Claim List for Review
router.get('/claims', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const claims = await prisma.claim.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            city: true,
            email: true,
          }
        },
        policy: {
          select: {
            planTier: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global claim list.' });
  }
});

// PUT /api/admin/claims/:id/status - Approve or Reject a Claim
router.put('/claims/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewerNotes } = req.body;

    if (!['PAID', 'REJECTED', 'REVIEW'].includes(status)) {
      res.status(400).json({ error: 'Invalid claim status provided.' });
      return;
    }

    const existingClaim = await prisma.claim.findUnique({
      where: { id: id as string },
      include: {
        user: true,
        policy: true,
      },
    });

    if (!existingClaim) {
      res.status(404).json({ error: 'Claim not found.' });
      return;
    }

    const payoutAmount = status === 'PAID'
      ? (existingClaim.payoutAmount && existingClaim.payoutAmount > 0
        ? existingClaim.payoutAmount
        : existingClaim.policy.coverageAmount)
      : existingClaim.payoutAmount;

    let updatedClaim = await prisma.claim.update({
      where: { id: id as string },
      data: {
        status,
        payoutAmount,
        reviewerNotes,
        updatedAt: new Date()
      }
    });

    if (status === 'PAID' && existingClaim.status !== 'PAID' && payoutAmount && payoutAmount > 0) {
      try {
        await debitTreasury({
          amount: payoutAmount,
          type: 'PAYOUT',
          referenceType: 'CLAIM',
          referenceId: existingClaim.id,
          note: `Manual admin approval payout`,
          createdByUserId: req.user?.userId,
        });

        const payoutResult = await initiateClaimPayout({
          claimId: existingClaim.id,
          userId: existingClaim.userId,
          amountRupees: payoutAmount,
          upiId: existingClaim.user.upiId || undefined,
        });

        updatedClaim = await prisma.claim.update({
          where: { id: existingClaim.id },
          data: {
            razorpayPayoutId: payoutResult.payoutId || null,
            reviewerNotes: `${reviewerNotes || ''} | Manual payout: ${payoutResult.message}`,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown payout error';
        updatedClaim = await prisma.claim.update({
          where: { id: existingClaim.id },
          data: {
            status: 'REVIEW',
            reviewerNotes: `${reviewerNotes || ''} | Manual payout failed: ${message}`,
          },
        });
      }
    }

    res.json(updatedClaim);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update claim adjudication.' });
  }
});

export default router;
