import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  return res.status(200).json({
    status: 'ok',
    platform: 'vercel',
    configured: hasKey,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  });
}
