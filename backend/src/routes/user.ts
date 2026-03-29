import express, { type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../prismaClient.js';

const router = express.Router();

// Get Full Authenticated User Profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        city: true,
        deliveryPlatform: true,
        vehicleType: true,
        weeklyEarnings: true,
        upiId: true,
        trustScore: true,
        isVerified: true,
        createdAt: true
      }
    });

    if (!userProfile) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.json(userProfile);
  } catch (error) {
    console.error('Fetch user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile data.' });
  }
});

export default router;
