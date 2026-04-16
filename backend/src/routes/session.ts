import express, { type Response } from 'express';
import crypto from 'crypto';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../prismaClient.js';
import { resolveIpContext } from '../services/ipIntel.js';
import { JWT_SECRET } from '../config.js';


const router = express.Router();

router.post('/heartbeat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userCity = req.user!.city;
    const ipContext = await resolveIpContext(req, userCity);
    const ipAddress = ipContext.ip;
    const ipCity = ipContext.city;

    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000);

    // Find the most recent active session for this user in the recent window.
    // Older buggy rows may have null endTime, so we also allow recent startTime for null endTime records.
    let session = await prisma.workSession.findFirst({
      where: {
        userId: userId,
        OR: [
          { endTime: { gte: thirtyMinsAgo } },
          {
            endTime: null,
            startTime: { gte: thirtyMinsAgo },
          },
        ],
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
          endTime: now,
          activeMinutes: 1,
          ipAddress,
          ipCity,
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

      // 🛡️ ANTI-SPAM: Prevent users from refreshing to spam active minutes
      if (session.endTime) {
        const secondsSinceLastBeat = (now.getTime() - session.endTime.getTime()) / 1000;
        if (secondsSinceLastBeat < 45) {
          // If too soon, just return the existing data without extending the chain
          res.json({
            success: true,
            activeMinutes: session.activeMinutes,
            status: 'Tracking active Work-Proof ✅',
            sessionHash: session.sessionHash,
            ipCity: session.ipCity,
            ipSource: ipContext.source,
          });
          return;
        }
      }

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
          ipAddress,
          ipCity,
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
      sessionHash: session.sessionHash,
      ipCity: session.ipCity,
      ipSource: ipContext.source,
    });

  } catch (error) {
    console.error('Work-Proof Heartbeat Error:', error);
    res.status(500).json({ error: 'Failed to record Work-Proof heartbeat.' });
  }
});

router.get('/activity-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const session = await prisma.workSession.findFirst({
      where: { userId },
      orderBy: { startTime: 'desc' },
      include: {
        heartbeats: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!session) {
      res.json({
        activeMinutes: 0,
        heartbeatCount: 0,
        sessionAgeMins: 0,
        lastHeartbeatAgoMins: null,
        avgHeartbeatGapMs: 0,
        jitterMs: 0,
      });
      return;
    }

    const now = Date.now();
    const sessionAgeMins = (now - session.startTime.getTime()) / 60000;
    const lastHb = session.heartbeats[session.heartbeats.length - 1];
    const lastHeartbeatAgoMins = lastHb ? (now - lastHb.timestamp.getTime()) / 60000 : null;

    const intervals: number[] = [];
    for (let i = 1; i < session.heartbeats.length; i++) {
      intervals.push(session.heartbeats[i].timestamp.getTime() - session.heartbeats[i - 1].timestamp.getTime());
    }

    const avgHeartbeatGapMs = intervals.length > 0
      ? intervals.reduce((acc, val) => acc + val, 0) / intervals.length
      : 0;

    const variance = intervals.length > 0
      ? intervals.reduce((acc, val) => acc + Math.pow(val - avgHeartbeatGapMs, 2), 0) / intervals.length
      : 0;

    res.json({
      activeMinutes: session.activeMinutes,
      heartbeatCount: session.heartbeats.length,
      sessionAgeMins: Math.round(sessionAgeMins),
      lastHeartbeatAgoMins: lastHeartbeatAgoMins !== null ? Math.round(lastHeartbeatAgoMins * 100) / 100 : null,
      avgHeartbeatGapMs: Math.round(avgHeartbeatGapMs),
      jitterMs: Math.round(Math.sqrt(variance)),
      startedAt: session.startTime,
    });
  } catch (error) {
    console.error('Activity stats error:', error);
    res.status(500).json({ error: 'Failed to fetch activity stats.' });
  }
});

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const JWT_SECRET = process.env.JWT_SECRET || 'kavach_pay_secret_zero_trust_2026';

    const sessions = await prisma.workSession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: 15,
      include: {
        heartbeats: { orderBy: { timestamp: 'asc' } },
      },
    });

    const result = sessions.map((session) => {
      const hbs = session.heartbeats;

      // Re-verify chain: mirrors exactly what the heartbeat route writes.
      // Beat 1: HMAC(userId-1-ip-startTime, '')
      // Beat N: HMAC(userId-N-ip-startTime, previousHash)
      let chainValid = true;
      let runningHash = '';
      for (let i = 0; i < hbs.length; i++) {
        const dataStr = `${userId}-${i + 1}-${hbs[i].ipAddress}-${session.startTime.toISOString()}`;
        const expected = crypto
          .createHmac('sha256', JWT_SECRET)   // ← same secret as heartbeat route
          .update(dataStr + runningHash)
          .digest('hex');
        if (expected !== hbs[i].hash) { chainValid = false; break; }
        runningHash = expected;
      }

      const durationMins = session.endTime
        ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000)
        : session.activeMinutes;

      return {
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        activeMinutes: session.activeMinutes,
        durationMins,
        heartbeatCount: hbs.length,
        ipCity: session.ipCity,
        ipAddress: session.ipAddress,
        isChainValid: chainValid,
        platformActiveFlag: session.platformActiveFlag,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Session history error:', error);
    res.status(500).json({ error: 'Failed to fetch session history.' });
  }
});

export default router;

