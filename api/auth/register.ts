import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/server/db.js';
import { generateToken, sanitizeInput } from '../../src/server/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { username, email, password, displayName } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (String(username).trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    if (db.findUserByUsername(cleanUsername)) {
      return res.status(409).json({ error: 'Username already in use.' });
    }

    if (db.findUserByEmail(cleanEmail)) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const newUser = db.createUser({
      username: cleanUsername,
      email: cleanEmail,
      password: String(password),
      displayName: displayName ? sanitizeInput(displayName) : undefined,
    });

    const token = generateToken(newUser);

    res.setHeader(
      'Set-Cookie',
      `campus_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.displayName,
      },
      token,
    });
  } catch (error: any) {
    console.error('Vercel registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
}
