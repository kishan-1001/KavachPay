import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BehavioralReport {
  score: number; // 0 to 1 (1 = Human, 0 = Bot)
  isBot: boolean;
  jitterMs: number;
  confidence: string;
}

/**
 * Behavioral Profiler (Pillar 1)
 * Analyzes the timing "Jitter" of work heartbeats.
 * Humans have natural variance in when they click/pulse (network lag, human timing).
 * Bots are too precise (e.g. exactly 60.000s every time).
 */
export async function analyzeSessionBehavior(sessionId: string): Promise<BehavioralReport> {
  const heartbeats = await prisma.workHeartbeat.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });

  if (heartbeats.length < 3) {
    return {
      score: 1.0, // Not enough data to convict
      isBot: false,
      jitterMs: 0,
      confidence: 'INSUFFICIENT_DATA'
    };
  }

  // Calculate intervals between heartbeats in milliseconds
  const intervals: number[] = [];
  for (let i = 1; i < heartbeats.length; i++) {
    const diff = heartbeats[i].timestamp.getTime() - heartbeats[i-1].timestamp.getTime();
    intervals.push(diff);
  }

  // Calculate Average and Standard Deviation (Jitter)
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const squareDiffs = intervals.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  /**
   * Threshold Logic:
   * If Standard Deviation < 150ms, it's almost certainly a script (too perfect).
   * If Standard Deviation > 800ms, it's definitely a human (manual interaction/network jitter).
   */
  let score = 1.0;
  if (stdDev < 150) {
    score = 0.1; // Highly suspicious (Bot)
  } else if (stdDev < 400) {
    score = 0.6; // Low jitter (Maybe a very stable connection or semi-automated)
  } else {
    score = 1.0; // Human-like jitter
  }

  return {
    score,
    isBot: score < 0.4,
    jitterMs: Math.round(stdDev),
    confidence: score < 0.4 ? 'BOT_DETECTED' : 'HUMAN_VERIFIED'
  };
}
