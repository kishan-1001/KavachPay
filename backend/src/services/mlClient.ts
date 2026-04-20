import axios from 'axios';

interface Pillar2Response {
  city: string;
  disruptionScore: number;
  isRealDisruption: boolean;
  evidence: string[];
  raw: Record<string, unknown>;
  algorithm: string;
}

interface Pillar1Response {
  score: number;
  isBot: boolean;
  jitterMs: number;
  confidence: string;
  algorithm: string;
}

interface Pillar3Heartbeat {
  timestamp: string;
  ipAddress: string;
  hash: string;
}

interface Pillar3Response {
  isChainValid: boolean;
  ipMatch: boolean;
  recencyMins: number;
  loginHour: number;
  score: number;
  confidence: string;
  algorithm: string;
}

interface Pillar4ClaimNode {
  userId: string;
  timestamp: string;
  ipAddress: string;
  workProofScore: number;
}

interface Pillar4Response {
  ringRisk: number;
  isSuspiciousCluster: boolean;
  clusterSize: number;
  algorithm: string;
}

interface AggregateResponse {
  trustScore: number;
  fraudScore: number;
  decision: 'PAID' | 'REVIEW';
  algorithm: string;
}

function getMlBaseUrl() {
  return (process.env.ML_SERVICE_URL || '').replace(/\/$/, '');
}

function getMlTimeoutMs(path: string): number {
  const configured = Number(process.env.ML_SERVICE_TIMEOUT_MS || '');
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  // Pillar 2 may call multiple external APIs and can legitimately take longer.
  if (path === '/api/pillar2/environmental-consensus') {
    return 25000;
  }

  return 12000;
}

async function postMl<TResponse>(path: string, body: unknown, headers?: Record<string, string>): Promise<TResponse | null> {
  const baseUrl = getMlBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await axios.post<TResponse>(`${baseUrl}${path}`, body, {
      timeout: getMlTimeoutMs(path),
      headers,
    });
    return response.data;
  } catch (error) {
    console.warn(`ML API unavailable for ${path}, falling back to local logic.`, error);
    return null;
  }
}

export async function getPillar2Consensus(city: string): Promise<Pillar2Response | null> {
  const newsKey = process.env.NEWS_API_KEY || '';
  const aqiKey = process.env.AQI_API_KEY || '';

  return postMl<Pillar2Response>(
    '/api/pillar2/environmental-consensus',
    { city },
    {
      'x-news-api-key': newsKey,
      'x-aqi-api-key': aqiKey,
    }
  );
}

export async function getPillar1BehavioralAuth(heartbeatTimestamps: string[]): Promise<Pillar1Response | null> {
  return postMl<Pillar1Response>('/api/pillar1/behavioral-auth', { heartbeatTimestamps });
}

export async function getPillar3SessionAuthenticity(payload: {
  userId: string;
  sessionStartTime: string;
  registeredCity: string;
  observedIpCity?: string;
  heartbeats: Pillar3Heartbeat[];
  loginHour?: number;         // hour of session start (0-23)
  isChainValid?: boolean;     // result of backend HMAC chain verification
}): Promise<Pillar3Response | null> {
  return postMl<Pillar3Response>('/api/pillar3/session-authenticity', payload);
}

export async function getPillar4RingRisk(claims: Pillar4ClaimNode[]): Promise<Pillar4Response | null> {
  return postMl<Pillar4Response>('/api/pillar4/ring-detect', { claims });
}

export async function getAggregateScore(payload: {
  pillar1Score: number;
  pillar2Score: number;
  pillar3Score: number;
  pillar4RingRisk: number;
}): Promise<AggregateResponse | null> {
  return postMl<AggregateResponse>('/api/score/aggregate', payload);
}
