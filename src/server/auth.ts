import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, UserRecord } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus-os-secure-token-secret-2025-9988231';
const TOKEN_EXPIRY = '7d';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  displayName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: UserRecord): string {
  const payload: AuthenticatedUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

// XSS Sanitizer for input strings
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input !== null && typeof input === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      cleaned[k] = sanitizeInput(v);
    }
    return cleaned;
  }
  return input;
}

// Authenticate token from HttpOnly cookie or Authorization header
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  let token: string | undefined;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check cookies if available
  if (!token && req.cookies && req.cookies.campus_token) {
    token = req.cookies.campus_token;
  }

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    const user = db.findUserById(decoded.id);

    if (!user) {
      req.user = undefined;
      return next();
    }

    // Role is strictly derived from the verified database record
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    };
    next();
  } catch {
    req.user = undefined;
    next();
  }
}

// Middleware: Require Authenticated User (Any role)
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.',
      code: 'UNAUTHORIZED',
    });
  }
  next();
}

// Middleware: Require Admin Role
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required. Please log in as administrator.',
      code: 'UNAUTHORIZED',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges required.',
      code: 'FORBIDDEN',
    });
  }

  next();
}
