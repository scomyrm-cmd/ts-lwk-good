import { createHash, createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateBlob } from './storage.js';

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Expected a JSON object');
  return value as Record<string, unknown>;
}

export function field(value: unknown, max: number, required = false) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || /\u0000/.test(value) || (required && !value.trim())) {
    throw new HttpError(400, 'A required field is missing or a field has an invalid value');
  }
  return value.trim();
}

export function choice<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new HttpError(400, 'Invalid field option');
  return value as T;
}

export function digest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function signingSecret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('Session secret unavailable');
  return value;
}

function header(req: VercelRequest, key: string) {
  const value = req.headers[key];
  return typeof value === 'string' ? value : '';
}

function trustedOrigin(req: VercelRequest, origin: string) {
  try {
    const url = new URL(origin);
    if (url.origin !== origin) return false;
    const configured = [process.env.APP_URL, ...(process.env.CAMPUS_ALLOWED_ORIGINS || '').split(',')];
    if (configured.some((value) => value?.trim() === origin)) return true;
    const local = process.env.VERCEL_ENV === 'development' || !process.env.VERCEL;
    return url.host === header(req, 'host') &&
      (url.protocol === 'https:' || (local && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)));
  } catch {
    return false;
  }
}

export function guardRequest(req: VercelRequest, res: VercelResponse, methods: readonly string[], maxBytes: number) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  const origin = header(req, 'origin');
  if (origin) {
    if (!trustedOrigin(req, origin)) throw new HttpError(403, 'Origin is not allowed');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (header(req, 'sec-fetch-site') === 'cross-site') {
    throw new HttpError(403, 'Origin is not allowed');
  }

  const method = req.method || 'GET';
  if (method === 'OPTIONS') {
    const headers = header(req, 'access-control-request-headers').toLowerCase().split(',').map((value) => value.trim());
    if (!origin || !methods.includes(header(req, 'access-control-request-method')) ||
      headers.some((value) => value && value !== 'content-type')) {
      throw new HttpError(403, 'Preflight request is not allowed');
    }
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
    res.status(204).end();
    return false;
  }

  if (!methods.includes(method)) {
    res.setHeader('Allow', [...methods, 'OPTIONS'].join(', '));
    throw new HttpError(405, 'Method not allowed');
  }

  if (!['GET', 'HEAD'].includes(method)) {
    if (header(req, 'content-type').split(';')[0].trim().toLowerCase() !== 'application/json') {
      throw new HttpError(415, 'Expected application/json');
    }
    if (Number(header(req, 'content-length')) > maxBytes) throw new HttpError(413, 'Request is too large');
    if (typeof req.body === 'string') {
      try { req.body = JSON.parse(req.body); }
      catch { throw new HttpError(400, 'Invalid JSON request'); }
    }
    object(req.body);
    if (Buffer.byteLength(JSON.stringify(req.body)) > maxBytes) throw new HttpError(413, 'Request is too large');
  }
  return true;
}

export function clientIp(req: VercelRequest) {
  const forwarded = process.env.VERCEL ? header(req, 'x-forwarded-for').split(',')[0].trim() : '';
  const value = forwarded || req.socket?.remoteAddress || '';
  return isIP(value) ? value : 'unknown';
}

type Bucket = { hits: number; resetAt: number };

export async function enforceLimit(
  res: VercelResponse,
  scope: string,
  identity: string,
  maximum: number,
  periodMs: number,
) {
  const key = createHmac('sha256', signingSecret()).update(scope + ':' + identity).digest('hex');
  const now = Date.now();
  const retry = await updateBlob(
    'limits/' + scope + '/' + key[0] + '.json',
    () => ({} as Record<string, Bucket>),
    (buckets) => {
      const active = buckets[key];
      if (active && active.resetAt > now && active.hits >= maximum) {
        return { result: active.resetAt - now, skipWrite: true };
      }

      for (const [id, entry] of Object.entries(buckets)) {
        if (entry.resetAt <= now) delete buckets[id];
      }
      if (!active && Object.keys(buckets).length >= 1200) return { result: periodMs, skipWrite: true };
      buckets[key] = active && active.resetAt > now
        ? { hits: active.hits + 1, resetAt: active.resetAt }
        : { hits: 1, resetAt: now + periodMs };
      return { result: 0 };
    },
  );
  if (retry) {
    res.setHeader('Retry-After', String(Math.ceil(retry / 1000)));
    throw new HttpError(429, 'Too many requests. Please try again later.');
  }
}
