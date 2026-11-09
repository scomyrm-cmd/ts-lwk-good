import type { VercelRequest, VercelResponse } from '@vercel/node';
import login from '../../src/server/apiHandlers/auth/login.js';
import logout from '../../src/server/apiHandlers/auth/logout.js';
import me from '../../src/server/apiHandlers/auth/me.js';
import register from '../../src/server/apiHandlers/auth/register.js';

const handlers: Record<string, (req: VercelRequest, res: VercelResponse) => Promise<unknown>> = {
  login, logout, me, register,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawAction = req.query.action;
  const action = typeof rawAction === 'string' ? rawAction : '';
  const routeHandler = handlers[action];
  if (!routeHandler) return res.status(404).json({ error: 'Unknown authentication endpoint.' });
  return routeHandler(req, res);
}
