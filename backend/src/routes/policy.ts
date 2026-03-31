import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../prismaClient.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { creditTreasury } from '../services/treasuryService.js';

const router = express.Router();

const PLAN_PRICES = {
  // Hackathon testing: BASIC is free (₹0)
  BASIC: 0, // ₹0 in paise
  STANDARD: 5500, // ₹55 in paise
  PREMIUM: 7500, // ₹75 in paise
};

const PLAN_COVERAGES = {
  BASIC: 1500,
  STANDARD: 2000,
  PREMIUM: 3000,
};

function isValidPlanTier(planTier: string): planTier is keyof typeof PLAN_PRICES {
  return Object.prototype.hasOwnProperty.call(PLAN_PRICES, planTier);
}

function isMockPaymentMode() {
  return (process.env.PAYMENT_MODE || 'live').toLowerCase() === 'mock';
}

// 1. Get User's Active Policy
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const activePolicy = await prisma.policy.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() } // not expired
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(activePolicy || null);
  } catch (error) {
    console.error('Fetch policy error:', error);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

// 2. Create Razorpay Order
router.post('/order', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { planTier } = req.body; // 'BASIC', 'STANDARD', 'PREMIUM'

    if (!isValidPlanTier(planTier)) {
      res.status(400).json({ error: 'Invalid plan tier selected.' });
      return;
    }

    // Check if user already has an active policy
    const existingPolicy = await prisma.policy.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      }
    });

    if (existingPolicy) {
      res.status(400).json({ error: 'You already have an active policy.' });
      return;
    }

    const amountInPaise = PLAN_PRICES[planTier];

    // Hackathon free tier: activate policy instantly (no Razorpay flow).
    if (amountInPaise === 0) {
      const coverageAmount = PLAN_COVERAGES[planTier];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 7-day coverage

      const newPolicy = await prisma.policy.create({
        data: {
          userId,
          planTier,
          status: 'ACTIVE',
          coverageAmount,
          premiumPaid: 0,
          startDate: new Date(),
          endDate
        }
      });

      res.json({ freeActivated: true, policy: newPolicy });
      return;
    }

    // Test-mode path for hackathon demos: activate paid policy without Razorpay network call.
    if (isMockPaymentMode()) {
      const coverageAmount = PLAN_COVERAGES[planTier];
      const amountInRupees = amountInPaise / 100;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const newPolicy = await prisma.policy.create({
        data: {
          userId,
          planTier,
          status: 'ACTIVE',
          coverageAmount,
          premiumPaid: amountInRupees,
          razorpayOrderId: `mock_order_${Date.now()}`,
          razorpayPaymentId: `mock_payment_${Date.now()}`,
          startDate: new Date(),
          endDate,
        }
      });

      await creditTreasury({
        amount: amountInRupees,
        type: 'PREMIUM',
        referenceType: 'POLICY',
        referenceId: newPolicy.id,
        note: `Mock premium credited for ${planTier} policy`,
        createdByUserId: userId,
      });

      res.json({ mockActivated: true, policy: newPolicy });
      return;
    }

    // Initialize Razorpay here to ensure process.env is injected by dotenv first
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${userId.slice(0, 8)}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    res.json({ order, planTier, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// 2b. Explicitly activate free BASIC plan without invoking payment flow.
router.post('/activate-free', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const existingPolicy = await prisma.policy.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: new Date() }
      }
    });

    if (existingPolicy) {
      res.status(400).json({ error: 'You already have an active policy.' });
      return;
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const newPolicy = await prisma.policy.create({
      data: {
        userId,
        planTier: 'BASIC',
        status: 'ACTIVE',
        coverageAmount: PLAN_COVERAGES.BASIC,
        premiumPaid: 0,
        startDate: new Date(),
        endDate,
      }
    });

    res.json({ freeActivated: true, policy: newPolicy });
  } catch (error) {
    console.error('Free policy activation error:', error);
    res.status(500).json({ error: 'Failed to activate free policy' });
  }
});

// 3. Verify Payment and Activate Policy
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planTier 
    } = req.body;

    if (!isValidPlanTier(planTier) || planTier === 'BASIC') {
      res.status(400).json({ error: 'Invalid paid plan tier for payment verification.' });
      return;
    }

    if (isMockPaymentMode()) {
      res.status(400).json({ error: 'Mock payment mode is enabled. Verification route is disabled.' });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ error: 'Invalid payment signature. Payment not verified.' });
      return;
    }

    // Payment is authentic; create the Policy
    const amountInRupees = PLAN_PRICES[planTier] / 100;
    const coverageAmount = PLAN_COVERAGES[planTier];

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // 7-day coverage

    const newPolicy = await prisma.policy.create({
      data: {
        userId,
        planTier,
        status: 'ACTIVE',
        coverageAmount,
        premiumPaid: amountInRupees,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        startDate: new Date(),
        endDate
      }
    });

    await creditTreasury({
      amount: amountInRupees,
      type: 'PREMIUM',
      referenceType: 'POLICY',
      referenceId: newPolicy.id,
      note: `Premium credited via payment verification for ${planTier} policy`,
      createdByUserId: userId,
    });

    res.json({ message: 'Payment successful, policy activated!', policy: newPolicy });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment and activate policy' });
  }
});

export default router;
