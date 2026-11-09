import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from '../../db.js';
import { JWT_SECRET, ALT_JWT_SECRET } from '../../auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.cookies?.campus_token || req.cookies?.campus_os_jwt || req.cookies?.campus_os_token);

  if (!token) {
    return res.status(200).json({ authenticated: false, user: null });
  }

  try {
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      try {
        decoded = jwt.verify(token, ALT_JWT_SECRET);
      } catch {
        return res.status(200).json({ authenticated: false, user: null });
      }
    }

    if (!decoded) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    const user = db.findUserById(decoded.id) || db.findUserByUsername(decoded.username);
    if (!user) {
      if (decoded.role === 'admin' || decoded.username === 'islamnourbouya') {
        return res.status(200).json({
          authenticated: true,
          user: {
            id: decoded.id || 'usr_admin_001',
            username: decoded.username || 'islamnourbouya',
            email: decoded.email || 'islamnourbouya@campus-os.edu',
            role: 'admin',
            displayName: decoded.displayName || 'Islam Nour Bouya',
          },
        });
      }
      return res.status(200).json({ authenticated: false, user: null });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
    });
  } catch {
    return res.status(200).json({ authenticated: false, user: null });
  }
}
