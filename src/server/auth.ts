import { randomUUID, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { addAuditEvent, mutateState, readState, type Account, type SchoolState } from './storage.js';
import { choice, clientIp, digest, enforceLimit, field, HttpError, object, signingSecret } from './security.js';

const SESSION_SECONDS = 12 * 60 * 60;
const USERNAME = /^[a-z0-9_.-]{3,70}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 12);
const COOKIE = 'campus_session';

export const setupUsername = () => process.env.CAMPUS_ADMIN_USERNAME?.trim().toLowerCase();

export function safeUser(user: Account) {
  const { id, username, email, displayName, role, createdAt, lastLogin, disabledAt, language } = user;
  return { id, username, email, displayName, role, createdAt, lastLogin, disabledAt, language };
}

export function usernameField(value: unknown) {
  const username = field(value, 70, true).toLowerCase();
  if (!USERNAME.test(username)) throw new HttpError(400, 'Use 3 to 70 letters, numbers, dots, underscores, or hyphens for the username');
  return username;
}

export function emailField(value: unknown) {
  const email = field(value, 160, true).toLowerCase();
  if (!EMAIL.test(email)) throw new HttpError(400, 'Enter a valid email address');
  return email;
}

function rejectAdminPassword(password: string) {
  const blocked = (process.env.CAMPUS_REJECTED_ADMIN_PASSWORD_SHA256 || '').split(',');
  return password.length < 10 || blocked.includes(digest(password));
}

export function newPassword(value: unknown, administrator = false) {
  const minimum = administrator ? 14 : 10;
  if (typeof value !== 'string' || value.length < minimum || Buffer.byteLength(value) > 72 || /\u0000/.test(value) ||
    (administrator && rejectAdminPassword(value))) {
    throw new HttpError(400, `Choose a fresh password with at least ${minimum} characters and at most 72 UTF-8 bytes`);
  }
  return value;
}

export function passwordHash(password: string) {
  return bcrypt.hash(password, 12);
}

function getClaims(req: VercelRequest) {
  const cookies = req.headers.cookie;
  if (!cookies) return null;
  const raw = /(?:^|;\s*)campus_session=([^;]{1,2048})(?:;|$)/.exec(String(cookies))?.[1];
  if (!raw) return null;
  try {
    const payload = jwt.verify(raw, signingSecret(), {
      algorithms: ['HS256'], issuer: 'campus-os', audience: 'campus-os',
    });
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.jti !== 'string' ||
      !Number.isInteger(payload.sv)) return null;
    return { userId: payload.sub, sessionId: payload.jti, version: payload.sv as number };
  } catch {
    return null;
  }
}

export function authUser(req: VercelRequest, db: SchoolState) {
  const claims = getClaims(req);
  if (!claims) return null;
  const session = db.sessions.find((entry) => entry.id === claims.sessionId && entry.userId === claims.userId);
  if (!session || session.expiresAt <= Date.now() || session.version !== claims.version) return null;
  return db.users.find((user) => user.id === session.userId && !user.disabledAt && user.sessionVersion === session.version) ?? null;
}

export const hasSession = (req: VercelRequest) => Boolean(getClaims(req));

export async function getCurrentUser(req: VercelRequest) {
  return getClaims(req) ? authUser(req, await readState()) : null;
}

export function requireUser(req: VercelRequest, db: SchoolState, admin = false) {
  const user = authUser(req, db);
  if (!user) throw new HttpError(401, 'Sign in to continue');
  if (admin && user.role !== 'admin') throw new HttpError(403, 'Administrator permission required');
  return user;
}

function setCookie(res: VercelResponse, value: string, seconds: number) {
  const secure = process.env.VERCEL_ENV !== 'development' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${seconds}`);
}

function openSession(db: SchoolState, user: Account) {
  const sessionId = randomUUID();
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  db.sessions = db.sessions.filter((entry) => entry.expiresAt > Date.now());
  db.sessions.push({ id: sessionId, userId: user.id, version: user.sessionVersion, expiresAt });
  user.lastLogin = new Date().toISOString();
  return jwt.sign({ sv: user.sessionVersion }, signingSecret(), {
    algorithm: 'HS256', subject: user.id, jwtid: sessionId, expiresIn: SESSION_SECONDS, issuer: 'campus-os', audience: 'campus-os',
  });
}

export function revokeUserSessions(db: SchoolState, user: Account) {
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  db.sessions = db.sessions.filter((session) => session.userId !== user.id);
}

export function identityTaken(db: SchoolState, username: string, email: string, except?: string) {
  return db.users.some((user) => user.id !== except && [user.username, user.email].some((value) =>
    Boolean(value) && (value === username || value === email)));
}

export async function login(req: VercelRequest, res: VercelResponse) {
  const ip = clientIp(req);
  await enforceLimit(res, 'login', ip, 12, 15 * 60_000);
  const body = object(req.body);
  const identity = field(body.username, 160, true).toLowerCase();
  if (typeof body.password !== 'string' || Buffer.byteLength(body.password) > 200 || !body.password) {
    throw new HttpError(400, 'Username and password required');
  }
  if (body.requireAdmin != null && typeof body.requireAdmin !== 'boolean') throw new HttpError(400, 'Invalid sign-in mode');
  const password = body.password;
  const state = await readState();
  const candidate = state.users.find((user) => user.username === identity || user.email === identity);
  const matched = await bcrypt.compare(password, candidate?.passwordHash || DUMMY_HASH);
  if (!matched || !candidate || candidate.disabledAt || (candidate.role === 'admin' && rejectAdminPassword(password))) {
    throw new HttpError(401, 'Invalid username or password');
  }
  if ((body.requireAdmin === true) !== (candidate.role === 'admin')) {
    throw new HttpError(403, candidate.role === 'admin' ? 'Use administrator sign-in' : 'Administrator permission required');
  }

  const { token, user } = await mutateState((db) => {
    const current = db.users.find((account) => account.id === candidate.id);
    if (!current || current.disabledAt || current.passwordHash !== candidate.passwordHash || current.role !== candidate.role) {
      throw new HttpError(401, 'Sign in again');
    }
    return { token: openSession(db, current), user: safeUser(current) };
  });
  setCookie(res, token, SESSION_SECONDS);
  return res.status(200).json({ success: true, user });
}

export async function register(req: VercelRequest, res: VercelResponse) {
  await enforceLimit(res, 'register', clientIp(req), 8, 60 * 60_000);
  const body = object(req.body);
  if ('role' in body || 'permissions' in body) throw new HttpError(400, 'Account roles are assigned by the server');
  const username = usernameField(body.username);
  const email = emailField(body.email);
  const displayName = field(body.displayName, 120) || username;
  const hash = await passwordHash(newPassword(body.password));
  const { user, token } = await mutateState((db) => {
    if (username === setupUsername() || identityTaken(db, username, email)) throw new HttpError(409, 'Username or email is unavailable');
    const account: Account = {
      id: randomUUID(), username, email, displayName, passwordHash: hash, role: 'user',
      createdAt: new Date().toISOString(), sessionVersion: 1,
    };
    db.users.push(account);
    return { token: openSession(db, account), user: safeUser(account) };
  });
  setCookie(res, token, SESSION_SECONDS);
  return res.status(201).json({ success: true, user });
}

export async function logout(req: VercelRequest, res: VercelResponse) {
  const claims = getClaims(req);
  if (claims) {
    await mutateState((db) => {
      db.sessions = db.sessions.filter((session) => session.id !== claims.sessionId);
    });
  }
  setCookie(res, '', 0);
  return res.status(200).json({ success: true });
}

export async function setUpAdministrator(req: VercelRequest, res: VercelResponse) {
  await enforceLimit(res, 'admin-setup', clientIp(req), 6, 60 * 60_000);
  const { code, password } = object(req.body);
  const configured = process.env.CAMPUS_ADMIN_SETUP_CODE;
  const username = setupUsername();
  if (!configured || configured.length < 32 || !username || !USERNAME.test(username) ||
    typeof code !== 'string' || code.length > 256 ||
    !timingSafeEqual(Buffer.from(digest(code)), Buffer.from(digest(configured)))) {
    throw new HttpError(401, 'Administrator setup code is invalid or unavailable');
  }
  const fingerprint = digest(configured);
  const hash = await passwordHash(newPassword(password, true));
  const { user, token } = await mutateState((db) => {
    if (db.adminSetupFingerprint === fingerprint || db.usedAdminSetupCodes?.includes(fingerprint)) {
      throw new HttpError(409, 'This setup code has already been used');
    }
    let primary = db.users.find((account) => account.username === username && account.role === 'admin');
    if (!primary && identityTaken(db, username, '')) throw new HttpError(409, 'The configured username belongs to another account');
    if (!primary) {
      primary = {
        id: randomUUID(), username, email: '', displayName: 'Administrator', passwordHash: hash,
        role: 'admin', createdAt: new Date().toISOString(), sessionVersion: 1,
      };
      db.users.push(primary);
    }
    const now = new Date().toISOString();
    for (const account of db.users.filter((entry) => entry.role === 'admin')) {
      revokeUserSessions(db, account);
      if (account.id !== primary.id) {
        account.disabledAt = now;
        account.passwordHash = '';
      }
    }
    primary.passwordHash = hash;
    delete primary.disabledAt;
    db.usedAdminSetupCodes = [...new Set([...db.usedAdminSetupCodes ?? [], ...(db.adminSetupFingerprint ? [db.adminSetupFingerprint] : []), fingerprint])];
    db.adminSetupFingerprint = fingerprint;
    addAuditEvent(db, primary.id, 'primary_administrator_activated');
    return { token: openSession(db, primary), user: safeUser(primary) };
  });
  setCookie(res, token, SESSION_SECONDS);
  return res.status(200).json({ success: true, user });
}

export async function changePassword(req: VercelRequest, res: VercelResponse, account: Account) {
  await enforceLimit(res, 'password-change', account.id, 6, 60 * 60_000);
  const body = object(req.body);
  const old = body.currentPassword;
  if (typeof old !== 'string' || Buffer.byteLength(old) > 200 || !await bcrypt.compare(old, account.passwordHash)) {
    throw new HttpError(401, 'Current password is incorrect');
  }
  const replacement = newPassword(body.password, account.role === 'admin');
  if (old === replacement) throw new HttpError(400, 'Choose a different password');
  const hash = await passwordHash(replacement);
  const token = await mutateState((db) => {
    const live = requireUser(req, db);
    if (live.id !== account.id || live.passwordHash !== account.passwordHash) throw new HttpError(401, 'Sign in again');
    live.passwordHash = hash;
    revokeUserSessions(db, live);
    addAuditEvent(db, live.id, 'password_changed');
    return openSession(db, live);
  });
  setCookie(res, token, SESSION_SECONDS);
  return res.status(200).json({ success: true });
}

export async function setUserLanguage(req: VercelRequest, res: VercelResponse) {
  const body = object(req.body);
  if (Object.keys(body).some((key) => key !== 'language')) throw new HttpError(400, 'Only the language preference may be changed');
  const language = choice(body.language, ['en', 'fr', 'ar'] as const);
  const user = await mutateState((db) => {
    const live = requireUser(req, db);
    live.language = language;
    return safeUser(live);
  });
  return res.status(200).json({ success: true, user });
}
