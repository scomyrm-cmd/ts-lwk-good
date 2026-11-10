import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { UserReport } from '../src/types/index.js';
import {
  changePassword, emailField, getCurrentUser, hasSession, identityTaken, login, logout, newPassword, passwordHash,
  register, requireUser, revokeUserSessions, safeUser, setUpAdministrator, setupUsername, setUserLanguage, usernameField,
} from '../src/server/auth.js';
import { answerAssistant, deleteConversations, listConversations } from '../src/server/campusAssistant.js';
import { generateStudentsExcelWorkbook } from '../src/server/excelExport.js';
import {
  applyUpdates, attendanceStatuses, categories, getAdminState, isoDate, publicCatalog, publishReport, schoolDate, versionOf,
} from '../src/server/records.js';
import { choice, enforceLimit, field, guardRequest, HttpError, object } from '../src/server/security.js';
import { addAuditEvent, mutateState, privatePath, readState, StorageFailure, storeReady, type Account, type SchoolState } from '../src/server/storage.js';
import { attendanceFacts, indexAttendance } from '../src/server/studentFacts.js';

const routes: Record<string, { methods: readonly string[]; bytes?: number }> = {
  health: { methods: ['GET'] },
  'auth/me': { methods: ['GET'] },
  'auth/login': { methods: ['POST'] },
  'auth/register': { methods: ['POST'] },
  'auth/logout': { methods: ['POST'] },
  'auth/admin-setup': { methods: ['POST'] },
  'auth/password': { methods: ['POST'] },
  'admin/entry': { methods: ['GET', 'HEAD'] },
  'user/reports': { methods: ['GET', 'POST'], bytes: 12_000 },
  'user/lost-found': { methods: ['GET'] },
  'user/preferences': { methods: ['PATCH'] },
  'campus-ai': { methods: ['GET', 'POST'], bytes: 100_000 },
  'admin/conversations': { methods: ['DELETE'] },
  'admin/users': { methods: ['GET', 'POST'] },
  'admin/users/:id': { methods: ['DELETE', 'PATCH'] },
  'admin/reports': { methods: ['GET', 'PATCH'] },
  'admin/lost-found': { methods: ['GET', 'POST'], bytes: 4_000_000 },
  'admin/students': { methods: ['GET', 'POST'], bytes: 4_000_000 },
  'admin/students/index': { methods: ['GET'] },
  'admin/students/save': { methods: ['POST'], bytes: 4_000_000 },
  'admin/students/export-excel': { methods: ['POST'] },
  'admin/state': { methods: ['GET', 'PUT'], bytes: 4_000_000 },
};

const success = (res: VercelResponse, data = {}) => res.status(200).json({ success: true, ...data });

function adminMutation<T>(req: VercelRequest, update: (db: SchoolState, admin: Account) => T) {
  return mutateState((db) => update(db, requireUser(req, db, true)));
}

async function submitReport(req: VercelRequest, res: VercelResponse, account: Account, db: SchoolState) {
  await enforceLimit(res, 'report', account.id, 20, 60 * 60_000);
  const body = object(req.body);
  const details = {
    type: choice(body.type, ['lost', 'found'] as const), title: field(body.title, 150, true),
    category: choice(body.category, categories), location: field(body.location, 200, true),
    description: field(body.description, 2500),
    date: body.date ? isoDate(body.date) : schoolDate(db.settings?.timeZone),
    contact: field(body.contact, 200) || account.email,
  };

  const report = await mutateState((live) => {
    const user = requireUser(req, live);
    const entry: UserReport = {
      ...details, id: randomUUID(), userId: user.id, userEmail: user.email, userName: user.displayName,
      status: 'pending', createdAt: new Date().toISOString(),
    };
    live.reports.unshift(entry);
    return entry;
  });
  return res.status(201).json({ success: true, report });
}

async function updateReport(req: VercelRequest, res: VercelResponse) {
  const body = object(req.body);
  const id = field(body.id, 120, true);
  const status = choice(body.status, ['pending', 'reviewed', 'resolved'] as const);
  if (body.publish != null && typeof body.publish !== 'boolean') throw new HttpError(400, 'Invalid publish choice');
  if (body.publish && status !== 'reviewed') throw new HttpError(400, 'Published reports must be reviewed');
  const report = await adminMutation(req, (db, admin) => {
    const entry = db.reports.find((candidate) => candidate.id === id);
    if (!entry) throw new HttpError(404, 'Report not found');
    entry.status = status;
    if (body.adminNotes != null) entry.adminNotes = field(body.adminNotes, 1000);
    if (body.publish) {
      publishReport(db, entry);
      addAuditEvent(db, admin.id, 'lost_found_report_published');
    }
    return entry;
  });
  return success(res, { report });
}

async function createAccount(req: VercelRequest, res: VercelResponse) {
  const body = object(req.body);
  const username = usernameField(body.username);
  const email = emailField(body.email);
  const displayName = field(body.displayName, 120, true);
  const role = choice(body.role, ['user', 'admin'] as const);
  const hash = await passwordHash(newPassword(body.password, role === 'admin'));
  const user = await adminMutation(req, (db, admin) => {
    if (username === setupUsername() || identityTaken(db, username, email)) throw new HttpError(409, 'Username or email is unavailable');
    const account: Account = {
      id: randomUUID(), username, email, displayName, role, passwordHash: hash,
      createdAt: new Date().toISOString(), sessionVersion: 1,
    };
    db.users.push(account);
    addAuditEvent(db, admin.id, 'account_created');
    return safeUser(account);
  });
  return res.status(201).json({ success: true, user });
}

async function changeAccount(req: VercelRequest, res: VercelResponse, id: string) {
  const body = object(req.body);
  if (Object.keys(body).some((key) => !['role', 'displayName', 'email', 'password'].includes(key))) {
    throw new HttpError(400, 'Invalid account field');
  }
  const role = body.role == null ? undefined : choice(body.role, ['admin', 'user'] as const);
  const name = body.displayName == null ? undefined : field(body.displayName, 120, true);
  const email = body.email == null ? undefined : emailField(body.email);
  const hash = body.password == null ? undefined : await passwordHash(newPassword(body.password, true));
  const user = await adminMutation(req, (db, admin) => {
    const target = db.users.find((account) => account.id === id && !account.disabledAt);
    if (!target) throw new HttpError(404, 'User not found');
    const deleting = req.method === 'DELETE';
    if (target.id === admin.id && (deleting || role || hash)) throw new HttpError(400, 'Use your own account settings');
    if (target.role === 'admin' && (deleting || role === 'user') &&
      db.users.filter((account) => account.role === 'admin' && !account.disabledAt).length <= 1) {
      throw new HttpError(409, 'The last administrator must stay active');
    }
    if (deleting) {
      target.disabledAt = new Date().toISOString();
      target.passwordHash = '';
      revokeUserSessions(db, target);
      addAuditEvent(db, admin.id, 'account_disabled');
      return safeUser(target);
    }

    if (email && identityTaken(db, target.username, email, target.id)) throw new HttpError(409, 'Email is unavailable');
    if (name) target.displayName = name;
    if (email) target.email = email;
    if (hash) target.passwordHash = hash;
    if (hash || (role && role !== target.role)) revokeUserSessions(db, target);
    if (role) target.role = role;
    addAuditEvent(db, admin.id, 'account_updated');
    return safeUser(target);
  });
  return success(res, { user });
}

async function exportExcel(req: VercelRequest, res: VercelResponse, db: SchoolState, admin: Account) {
  const body = object(req.body);
  if (body.confirmed !== true) throw new HttpError(400, 'Confirm the export before downloading');
  const filterClass = field(body.filterClass, 120) || 'all';
  const filterStatus = body.filterStatus == null ? 'all' :
    choice(body.filterStatus, ['all', 'unmarked', ...attendanceStatuses] as const);
  const date = body.date ? isoDate(body.date) : schoolDate(db.settings?.timeZone);
  const attendance = indexAttendance(db.attendance);
  const students = db.students.filter((student) =>
    (filterClass === 'all' || student.className === filterClass) &&
    (filterStatus === 'all' || (attendance.get(student.studentId)?.get(date)?.status || 'unmarked') === filterStatus),
  ).map((student) => {
    const counts = attendanceFacts(attendance.get(student.studentId)?.values() ?? [], date);
    return { ...student, todayStatus: counts.today, attendanceRatePercent: counts.rate, totalAbsences: counts.absent };
  });
  const buffer = await generateStudentsExcelWorkbook({
    schoolName: db.schoolInfo?.name || 'Campus OS', exportedBy: admin.displayName, exportDate: date,
    students, filterClass, filterStatus,
  });
  await adminMutation(req, (live, user) => addAuditEvent(live, user.id, 'student_export_xlsx'));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="CampusOS_Students.xlsx"');
  res.setHeader('X-Campus-Export-Count', String(students.length));
  return res.status(200).send(buffer);
}

async function route(req: VercelRequest, res: VercelResponse) {
  const rawRoute = req.query.route;
  const name = (Array.isArray(rawRoute) ? rawRoute.join('/') : rawRoute || '').replace(/^\/|\/$/g, '');
  const accountId = /^admin\/users\/([\w-]{1,120})$/.exec(name)?.[1];
  const key = accountId ? 'admin/users/:id' : name;
  const spec = Object.hasOwn(routes, key) ? routes[key] : undefined;
  if (!spec) throw new HttpError(404, 'Unknown endpoint');
  if (!guardRequest(req, res, spec.methods, spec.bytes ?? 8192)) return;
  const method = req.method || 'GET';

  if (name === 'health') return res.status(200).json({
    status: 'ok', storageConfigured: storeReady(), aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    storageMode: privatePath('state.json').includes('/previews/') ? 'isolated-preview' : 'production',
  });

  if (name === 'admin/entry') {
    const user = await getCurrentUser(req);
    if (user?.role === 'user') throw new HttpError(403, 'Administrator permission required');
    res.setHeader('Location', user ? '/' : '/admin/login');
    return res.status(302).end();
  }

  if (!storeReady()) throw new HttpError(503, 'Private storage is unavailable');
  if (name === 'auth/login') return login(req, res);
  if (name === 'auth/register') return register(req, res);
  if (name === 'auth/logout') return logout(req, res);
  if (name === 'auth/admin-setup') return setUpAdministrator(req, res);
  if (name === 'auth/me') {
    const user = await getCurrentUser(req);
    return res.status(200).json({ authenticated: Boolean(user), user: user ? safeUser(user) : null });
  }

  if (!hasSession(req)) throw new HttpError(401, 'Sign in to continue');
  const db = await readState();
  const account = requireUser(req, db, name.startsWith('admin/') || name === 'campus-ai');
  if (name === 'auth/password') return changePassword(req, res, account);

  if (name === 'user/lost-found') return success(res, { items: publicCatalog(db) });
  if (name === 'user/reports') {
    return method === 'GET'
      ? success(res, { reports: db.reports.filter((report) => report.userId === account.id) })
      : submitReport(req, res, account, db);
  }
  if (name === 'user/preferences') {
    await enforceLimit(res, 'preferences', account.id, 40, 15 * 60_000);
    return setUserLanguage(req, res);
  }
  if (name === 'campus-ai') {
    return method === 'GET'
      ? success(res, { configured: Boolean(process.env.GEMINI_API_KEY), model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' })
      : answerAssistant(req, res, db, account);
  }

  if (method !== 'GET') await enforceLimit(res, 'admin-write', account.id, 180, 15 * 60_000);
  if (name === 'admin/conversations') return deleteConversations(req, res);
  if (name === 'admin/users') {
    return method === 'GET'
      ? success(res, { users: db.users.filter((user) => !user.disabledAt).map(safeUser) })
      : createAccount(req, res);
  }
  if (accountId) return changeAccount(req, res, accountId);

  if (name === 'admin/reports') {
    return method === 'GET' ? success(res, { reports: db.reports }) : updateReport(req, res);
  }

  if (name === 'admin/students/export-excel') return exportExcel(req, res, db, account);
  if (name === 'admin/students' || name === 'admin/students/index' || name === 'admin/students/save') {
    if (method === 'GET') return success(res, { students: db.students, lastSavedAt: db.studentsLastSaved, version: versionOf(db.students) });
    const body = object(req.body);
    const saved = await adminMutation(req, (live) => {
      const versions = applyUpdates(live, { students: body.students }, { students: body.version });
      live.studentsLastSaved = new Date().toISOString();
      return { count: live.students.length, savedAt: live.studentsLastSaved, version: versions.students };
    });
    return success(res, saved);
  }

  if (name === 'admin/lost-found') {
    if (method === 'GET') return success(res, { items: db.lostFoundItems, version: versionOf(db.lostFoundItems) });
    const body = object(req.body);
    const versions = await adminMutation(req, (live) =>
      applyUpdates(live, { lostFoundItems: body.items }, { lostFoundItems: body.version }));
    return success(res, { versions });
  }

  if (name === 'admin/state') {
    if (method === 'GET') return success(res, {
      ...getAdminState(db), conversations: listConversations(db, account),
    });
    const body = object(req.body);
    const versions = await adminMutation(req, (live) => applyUpdates(live, object(body.state), object(body.versions)));
    return success(res, { versions });
  }

  throw new HttpError(404, 'Unknown endpoint');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    return await route(req, res);
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ success: false, error: error.message });
    if (error instanceof StorageFailure) {
      console.error('Campus OS storage request failed', error.operation, error.reason);
    } else {
      console.error('Campus OS server operation failed', error instanceof Error ? error.constructor.name : 'UnknownError');
    }
    return res.status(503).json({ success: false, error: 'Server operation unavailable. Please try again.' });
  }
}
