import express, { type Response } from 'express';
import crypto from 'crypto';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../prismaClient.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// A mock utility to simulate real Indian ISP blocks for localhost testing
const generateMockIPForCity = (city: string) => {
  const cityMocks: Record<string, string> = {
    'Bengaluru': '103.116.14.22', // Mock BSNL / Jio IP
    'Mumbai': '49.36.195.10',     // Mock Airtel IP
    'Delhi': '103.21.55.8',
    'Chennai': '152.57.99.112',
    'Hyderabad': '223.187.20.1'
  };
  return cityMocks[city] || '127.0.0.1';
};

router.post('/heartbeat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userCity = req.user!.city;

    // Detect IP. If localhost, use our mock function for testing the geo-features later.
    let ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === '::ffff:127.0.0.1') {
       ipAddress = generateMockIPForCity(userCity);
    }

    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);

    // Find the most recent active session for this user
    let session = await prisma.workSession.findFirst({
      where: {
        userId: userId,
        startTime: { gte: fifteenMinsAgo }
      },
      orderBy: { startTime: 'desc' }
    });

    if (!session) {
      // 1. Create a brand new Work-Proof Session
      const sessionDataString = `${userId}-1-${ipAddress}-${now.toISOString()}`;
      const sessionHash = crypto.createHmac('sha256', JWT_SECRET).update(sessionDataString).digest('hex');

      session = await prisma.workSession.create({
        data: {
          userId,
          startTime: now,
          activeMinutes: 1,
          ipAddress,
          ipCity: userCity, 
          sessionHash,
          platformActiveFlag: true,
          heartbeats: {
            create: {
              ipAddress,
              hash: sessionHash,
              timestamp: now
            }
          }
        }
      });
    } else {
      // 2. Extend an existing Session and verify chain
      const newActiveMinutes = session.activeMinutes + 1;
      const sessionDataString = `${userId}-${newActiveMinutes}-${ipAddress}-${session.startTime.toISOString()}`;
      
      const newSessionHash = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(sessionDataString + session.sessionHash) 
        .digest('hex');

      session = await prisma.workSession.update({
        where: { id: session.id },
        data: {
          activeMinutes: newActiveMinutes,
          previousSessionHash: session.sessionHash,
          sessionHash: newSessionHash,
          endTime: now,
          heartbeats: {
            create: {
              ipAddress,
              hash: newSessionHash,
              timestamp: now
            }
          }
        }
      });
    }

    res.json({
      success: true,
      activeMinutes: session.activeMinutes,
      status: 'Tracking active Work-Proof ✅',
      sessionHash: session.sessionHash
    });

  } catch (error) {
    console.error('Work-Proof Heartbeat Error:', error);
    res.status(500).json({ error: 'Failed to record Work-Proof heartbeat.' });
  }
});

export default router;
