import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from '../../../src/server/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus-os-secure-jwt-secret-key-production-2025';

function verifyAdmin(req: VercelRequest): { id: string; username: string; role: string } | null {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies?.campus_os_jwt;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.role === 'admin') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Headers
  const origin = req.headers.origin as string;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // Admin authorization check
  const admin = verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Access denied: Admin credentials required.' });
  }

  try {
    const students = db.getStudents();
    const lastSavedAt = db.getStudentsLastSaved();
    return res.status(200).json({
      success: true,
      students,
      lastSavedAt,
    });
  } catch (err: any) {
    console.error('Vercel get students error:', err);
    return res.status(500).json({ error: 'Failed to retrieve student records from server.' });
  }
}
