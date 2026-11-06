import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number; // Duration of window in ms
  max: number; // Max requests allowed in window
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }, 60000);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    let record = store.get(ip);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + options.windowMs,
      };
      store.set(ip, record);
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', options.max - 1);
      return next();
    }

    record.count++;

    if (record.count > options.max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        error: options.message || 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds: retryAfter,
      });
    }

    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - record.count));
    next();
  };
}

// Pre-configured rate limiters
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
});

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Campus AI request limit reached. Please wait a moment before sending more queries.',
});

export const reportLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many reports submitted. Please wait before submitting another report.',
});

export const exportLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Export limit reached. Please wait before exporting student data again.',
});
