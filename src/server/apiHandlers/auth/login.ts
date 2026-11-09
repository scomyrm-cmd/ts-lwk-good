import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db.js';
import { verifyPassword, generateToken, sanitizeInput } from '../../auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security headers
  const origin = req.headers.origin as string;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { username, password, requireAdmin: adminOnly } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const clean = String(username).trim().toLowerCase();
    const cleanPass = String(password);

    // Direct check for primary administrator: islamnourbouya / islamoss1980
    if (clean === 'islamnourbouya' && cleanPass === 'islamoss1980') {
      let adminUser = db.findUserByUsername('islamnourbouya');
      if (!adminUser) {
        adminUser = {
          id: 'usr_admin_001',
          username: 'islamnourbouya',
          email: 'islamnourbouya@campus-os.edu',
          passwordHash: '',
          role: 'admin',
          displayName: 'Islam Nour Bouya',
          createdAt: new Date().toISOString(),
        };
      }
      db.updateLastLogin(adminUser.id);
      const token = generateToken(adminUser);

      res.setHeader(
        'Set-Cookie',
        `campus_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      );

      return res.status(200).json({
        success: true,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          displayName: adminUser.displayName,
        },
        token,
      });
    }

    const user = db.findUserByUsername(clean) || db.findUserByEmail(clean);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValid = verifyPassword(cleanPass, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (adminOnly && user.role !== 'admin' && user.username !== 'islamnourbouya') {
      return res.status(403).json({
        error: 'Access denied: Administrator privileges required for the Admin Portal.',
        code: 'ADMIN_REQUIRED',
      });
    }

    db.updateLastLogin(user.id);
    const token = generateToken(user);

    res.setHeader(
      'Set-Cookie',
      `campus_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error: any) {
    console.error('Vercel login error:', error);
    return res.status(500).json({ error: 'An error occurred during authentication.' });
  }
}
