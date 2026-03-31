import axios from 'axios';
import type { Request } from 'express';

interface IpContext {
  ip: string;
  city: string | null;
  source: 'geo' | 'mock' | 'unknown';
}

const LOCAL_IPS = new Set(['::1', '127.0.0.1', '::ffff:127.0.0.1']);

const CITY_MOCK_IPS: Record<string, string> = {
  Bengaluru: '103.116.14.22',
  Mumbai: '49.36.195.10',
  Delhi: '103.21.55.8',
  Chennai: '152.57.99.112',
  Hyderabad: '223.187.20.1',
};

function normalizeIp(rawIp: string) {
  if (!rawIp) return '127.0.0.1';
  if (rawIp.startsWith('::ffff:')) return rawIp.replace('::ffff:', '');
  return rawIp;
}

function getIpFromForwardedHeader(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  if (!forwarded) return null;

  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw.split(',')[0]?.trim();
  return first || null;
}

export function extractClientIp(req: Request) {
  const fromForwarded = getIpFromForwardedHeader(req);
  if (fromForwarded) {
    return normalizeIp(fromForwarded);
  }

  const fromReq = (req.ip || req.socket?.remoteAddress || '').toString();
  return normalizeIp(fromReq || '127.0.0.1');
}

export function isIpCityMatch(observedCity: string | null | undefined, registeredCity: string) {
  if (!observedCity) {
    // No geolocation signal should be treated as neutral in prototype mode.
    return true;
  }

  const observed = observedCity.trim().toLowerCase();
  const registered = registeredCity.trim().toLowerCase();

  if (observed === registered) return true;

  // Loose matching helps tolerate small formatting/provider differences.
  return observed.includes(registered) || registered.includes(observed);
}

async function lookupIpCity(ip: string) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,city`, {
      timeout: 5000,
    });

    if (response.data?.status === 'success' && response.data?.city) {
      return String(response.data.city);
    }
  } catch {
    // best-effort lookup
  }

  return null;
}

export async function resolveIpContext(req: Request, userCity: string): Promise<IpContext> {
  const extractedIp = extractClientIp(req);

  if (LOCAL_IPS.has(extractedIp)) {
    return {
      ip: CITY_MOCK_IPS[userCity] || '127.0.0.1',
      city: userCity,
      source: 'mock',
    };
  }

  const city = await lookupIpCity(extractedIp);
  if (city) {
    return {
      ip: extractedIp,
      city,
      source: 'geo',
    };
  }

  return {
    ip: extractedIp,
    city: null,
    source: 'unknown',
  };
}
