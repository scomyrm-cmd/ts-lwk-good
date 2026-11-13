import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import ExcelJS from 'exceljs';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type MockBlob = { etag: string; json: string };
class BlobPreconditionFailedError extends Error {}
class BlobNotFoundError extends Error {}
const blobs = new Map<string, MockBlob>();
let revision = 0;
let providerRequests: Array<{ model: string; contents: unknown; config: { systemInstruction: string } }> = [];
const emailRequests: Array<Record<string, any>> = [];
let emailResponse = 200;
let providerOverride: unknown;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  if (String(input) === 'https://api.emailjs.com/api/v1.0/email/send') {
    emailRequests.push(JSON.parse(String(init?.body)));
    if (emailResponse === 0) throw new Error('Fixture interrupted response');
    return new Response(emailResponse === 200 ? 'OK' : 'Fixture provider error', { status: emailResponse });
  }
  return originalFetch(input, init);
};

process.env.BLOB_READ_WRITE_TOKEN = 'isolated-storage-fixture';
process.env.JWT_SECRET = 'isolated-test-signing-key-at-least-thirty-two-characters';
process.env.GEMINI_API_KEY = 'isolated-provider-fixture';
process.env.GEMINI_MODEL = 'retired-fixture-model';
process.env.CAMPUS_ADMIN_USERNAME = 'qa_owner';
process.env.CAMPUS_ADMIN_SETUP_CODE = 'first-one-time-setup-code-for-local-test-123456789';
process.env.VERCEL_ENV = 'production';
delete process.env.VERCEL;

const mock = {
  async get(path: string, options: { access: string; useCache: boolean }) {
    assert.equal(options.access, 'private');
    assert.equal(options.useCache, false);
    const record = blobs.get(path);
    return record ? { statusCode: 200, blob: { etag: 'origin-etag-' + record.etag }, stream: new Response(record.json).body } : null;
  },
  async head(path: string) {
    const record = blobs.get(path);
    if (!record) throw new BlobNotFoundError();
    return { etag: record.etag };
  },
  async put(path: string, json: string, options: { ifMatch?: string; allowOverwrite: boolean; access: string }) {
    assert.equal(options.access, 'private');
    await new Promise((resolve) => setTimeout(resolve, 1));
    const current = blobs.get(path);
    if (options.ifMatch && current?.etag !== options.ifMatch) {
      throw new BlobPreconditionFailedError('ETag changed');
    }
    if (!options.allowOverwrite && current) throw new Error('Blob already exists');
    blobs.set(path, { etag: String(++revision), json });
  },
  provider(args: (typeof providerRequests)[number]) {
    providerRequests.push(args);
    if (args.model === 'retired-fixture-model') throw Object.assign(new Error('Fixture model not found'), { status: 404 });
    if (JSON.stringify(args.contents).includes('Fixture timeout')) throw new DOMException('Request timed out', 'TimeoutError');
    if (providerOverride !== undefined) return { text: JSON.stringify(providerOverride), candidates: [{ finishReason: 'STOP' }] };
    const instruction = args.config.systemInstruction;
    const text = instruction.includes('Moroccan Darija') ? 'هادي خلاصة الحضور.' :
      instruction.includes('Answer in French') ? 'Voici le bilan de présence.' : 'Here is the attendance summary.';
    return { text: JSON.stringify({ text, studentChanges: [], attendanceChanges: [] }) };
  },
};
Object.assign(globalThis, { campusTestDoubles: { ...mock, BlobPreconditionFailedError, BlobNotFoundError } });

const source = (code: string) => 'data:text/javascript,' + encodeURIComponent(code);
const storage = source('export const { get, head, put, BlobPreconditionFailedError, BlobNotFoundError } = globalThis.campusTestDoubles;');
const provider = source('export class GoogleGenAI { models = { generateContent: globalThis.campusTestDoubles.provider } }');
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@vercel/blob') return { url: storage, shortCircuit: true };
    if (specifier === '@google/genai') return { url: provider, shortCircuit: true };
    return next(specifier, context);
  },
});

const { default: handle } = await import('../api/handler.js');
const { digest } = await import('../src/server/security.js');
const { passwordHash } = await import('../src/server/auth.js');
const { schoolDate } = await import('../src/server/records.js');
const { studentContact } = await import('../src/utils/studentContact.js');

const host = 'campus.example.test';
const origin = 'https://' + host;
const student = {
  id: 'student-record', studentId: 'STU-42', firstName: 'Maya', lastName: 'River',
  className: 'Form 2', dateOfBirth: '2012-08-03', guardianContact: '+212 677 123 456',
  notes: '=HYPERLINK("https://example.invalid","Open")', createdAt: '2025-09-02',
};
const today = schoolDate();
const reports = [
  { type: 'lost', title: '<img src=x onerror=alert(1)>', category: 'Books', location: 'Library', date: today, description: 'Fixture report' },
  { type: 'found', title: 'Blue water bottle', category: 'Accessories', location: 'Gym', date: today, description: 'Fixture report' },
];

async function api(name: string, method = 'GET', body?: unknown, cookie?: string, extra: Record<string, string> = {}, ip = '192.0.2.1') {
  const headers: Record<string, string> = { host, ...(cookie && { cookie }), ...extra };
  if (body !== undefined && !headers['content-type']) headers['content-type'] = 'application/json';
  const response = {
    code: 200, headers: {} as Record<string, string>, data: null as any,
    status(code: number) { this.code = code; return this; },
    setHeader(key: string, value: string) { this.headers[key.toLowerCase()] = value; return this; },
    json(data: unknown) { this.data = data; return this; },
    send(data: unknown) { this.data = data; return this; },
    end() { return this; },
  };
  const [route, search = ''] = name.split('?', 2);
  const request = { method, query: { route, ...Object.fromEntries(new URLSearchParams(search)) }, body, headers, socket: { remoteAddress: ip } };
  await handle(request as unknown as VercelRequest, response as unknown as VercelResponse);
  return response;
}

function session(response: Awaited<ReturnType<typeof api>>) {
  const value = response.headers['set-cookie'];
  assert.match(value, /HttpOnly; Secure; SameSite=Lax/);
  return value.split(';')[0];
}

test('server roles, private persistence, controlled catalog, export, AI, and rotation', async () => {
  const guest = await api('admin/entry');
  assert.equal(guest.code, 302);
  assert.equal(guest.headers.location, '/admin/login');
  assert.equal((await api('admin/state')).code, 401);
  assert.equal((await api('auth/login', 'GET')).code, 405);
  assert.equal((await api('auth/login', 'POST', {}, undefined, { origin: 'https://untrusted.test' })).code, 403);
  const preflight = await api('auth/login', 'OPTIONS', undefined, undefined, {
    origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type',
  });
  assert.equal(preflight.code, 204);
  assert.equal(preflight.headers['access-control-allow-origin'], origin);
  assert.equal((await api('auth/login', 'OPTIONS', undefined, undefined, {
    origin: 'https://untrusted.test', 'access-control-request-method': 'POST',
  })).code, 403);

  const setup = await api('auth/admin-setup', 'POST', {
    code: process.env.CAMPUS_ADMIN_SETUP_CODE, password: 'qa-owner-first-private-passphrase',
  });
  assert.equal(setup.code, 200);
  const admin = session(setup);
  assert.equal((await api('admin/entry', 'GET', undefined, admin)).headers.location, '/');
  assert.equal((await api('auth/admin-setup', 'POST', {
    code: process.env.CAMPUS_ADMIN_SETUP_CODE, password: 'qa-owner-another-private-passphrase',
  })).code, 409);

  const base = (await api('admin/state', 'GET', undefined, admin)).data;
  assert.equal('sessions' in base.state, false);
  assert.equal('users' in base.state, false);
  assert.equal('adminSetupFingerprint' in base.state, false);
  const saved = await api('admin/state', 'PUT', {
    state: {
      students: [student],
      attendance: [{ id: 'attendance-1', studentId: student.studentId, date: today, status: 'absent', updatedAt: new Date().toISOString() }],
    },
    versions: base.versions,
  }, admin, { origin });
  assert.equal(saved.code, 200);
  assert.equal((await api('admin/state', 'PUT', { state: { students: [] }, versions: base.versions }, admin)).code, 409);
  assert.equal((await api('admin/state', 'PUT', {
    state: { students: [{ ...student, id: '' }] }, versions: saved.data.versions,
  }, admin)).code, 400);

  const extra = await api('admin/users', 'POST', {
    username: 'qa_secondary', email: 'secondary@example.invalid', displayName: 'QA Secondary',
    password: 'qa-secondary-private-passphrase', role: 'admin',
  }, admin);
  assert.equal(extra.code, 201);
  const secondary = session(await api('auth/login', 'POST', {
    username: 'qa_secondary', password: 'qa-secondary-private-passphrase', requireAdmin: true,
  }));

  const userData = {
    username: 'qa_student', email: 'student@example.invalid', displayName: 'QA Student', password: 'qa-student-private-passphrase',
  };
  assert.equal((await api('auth/register', 'POST', { ...userData, role: 'admin' })).code, 400);
  const learner = session(await api('auth/register', 'POST', userData));
  const second = session(await api('auth/register', 'POST', { ...userData, username: 'qa_other', email: 'other@example.invalid' }));
  assert.equal((await api('admin/entry', 'GET', undefined, learner)).code, 403);
  assert.equal((await api('admin/lost-found', 'GET', undefined, learner)).code, 403);
  assert.equal((await api('admin/attendance-emails', 'GET', undefined, learner)).code, 403);
  assert.equal((await api('admin/students/export-excel', 'POST', { confirmed: true }, learner)).code, 403);
  assert.equal((await api('campus-ai', 'POST', { prompt: 'hi', conversationId: 'test' }, learner)).code, 403);
  assert.equal((await api('user/preferences', 'PATCH', { language: 'ar', role: 'admin' }, learner)).code, 400);
  assert.equal((await api('user/preferences', 'PATCH', { language: 'ar' }, learner)).code, 200);
  assert.equal((await api('auth/me', 'GET', undefined, learner)).data.user.language, 'ar');

  const submitted = await Promise.all(reports.map((report) => api('user/reports', 'POST', report, learner)));
  assert.deepEqual(submitted.map(({ code }) => code), [201, 201]);
  assert.equal((await api('user/reports', 'GET', undefined, learner)).data.reports.length, 2);
  assert.equal((await api('user/reports', 'GET', undefined, second)).data.reports.length, 0);
  assert.equal((await api('admin/reports', 'GET', undefined, admin)).data.reports.length, 2);
  assert.equal((await api('user/lost-found', 'GET', undefined, learner)).data.items.length, 0);
  const published = await api('admin/reports', 'PATCH', { id: submitted[0].data.report.id, status: 'reviewed', publish: true }, admin);
  assert.equal(published.code, 200);
  const item = (await api('user/lost-found', 'GET', undefined, learner)).data.items[0];
  assert.equal(item.itemName, reports[0].title);
  assert.equal('contactInformation' in item, false);
  assert.equal('reporterName' in item, false);

  assert.equal((await api('admin/students/export-excel', 'POST', {}, admin)).code, 400);
  const exportResult = await api('admin/students/export-excel', 'POST', { confirmed: true, filterStatus: 'absent', date: today }, admin);
  assert.equal(exportResult.code, 200);
  assert.equal(exportResult.headers['x-campus-export-count'], '1');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(exportResult.data);
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.getCell('B5').value, 'Maya River');
  assert.equal(sheet.getCell('H5').value, 0);
  assert.equal(sheet.getCell('I5').value, 1);
  assert.equal(sheet.getCell('J5').value, "'" + student.notes);
  assert.equal(sheet.getCell('E5').value instanceof Date, true);
  const privateState = () => JSON.parse(blobs.get('campus-os/private/state.json')!.json);
  assert.equal(privateState().auditEvents.some((entry: any) =>
    entry.actorId === setup.data.user.id && entry.type === 'student_export_xlsx' && entry.at), true);

  const thread = 'fixture-thread';
  providerRequests = [];
  const reply = await api('campus-ai', 'POST', {
    conversationId: thread, prompt: 'Summarize student Maya River STU-42 and the guardian contact', language: 'fr',
  }, admin);
  assert.equal(reply.code, 200);
  assert.equal(reply.data.detectedLanguage, 'en');
  assert.equal(reply.data.source, 'gemini-api');
  assert.equal(reply.data.model, 'gemini-3.5-flash-lite');
  assert.match(reply.data.text, /Maya River \(STU-42\)/);
  const followup = await api('campus-ai', 'POST', { conversationId: thread, prompt: 'Et quel est son bilan ?', language: 'en' }, admin);
  assert.equal(followup.data.detectedLanguage, 'fr');
  assert.match(followup.data.text, /Maya River/);
  const arabic = await api('campus-ai', 'POST', { conversationId: thread, prompt: 'هل يمكنك تلخيص حضوره؟', language: 'en' }, admin);
  assert.equal(arabic.data.detectedLanguage, 'ar');
  assert.match(arabic.data.text, /Maya River/);
  const darija = await api('campus-ai', 'POST', { conversationId: thread, prompt: 'عطيني الغياب ديالها', language: 'en' }, admin);
  assert.equal(darija.data.detectedLanguage, 'darija');
  assert.match(darija.data.text, /Maya River/);
  const providerContext = JSON.parse(providerRequests.at(-1)!.config.systemInstruction.split('\n').at(-1)!);
  assert.equal(providerContext.students[0].firstName, student.firstName);
  assert.equal(providerContext.students[0].guardianContact, student.guardianContact);
  assert.equal(providerContext.students[0].notes, student.notes);
  assert.equal(providerContext.attendance.length, 1);
  for (const forbidden of ['users', 'sessions', 'passwordHash', 'adminSetupFingerprint']) assert.equal(forbidden in providerContext, false);
  assert.equal((await api('admin/state', 'GET', undefined, admin)).data.conversations[0].messages.length, 8);
  assert.equal((await api('admin/state', 'GET', undefined, secondary)).data.conversations.length, 0);
  const limited = await api('campus-ai', 'POST', {
    conversationId: 'fixture-provider-timeout', prompt: 'Fixture timeout. Summarize student STU-42.',
  }, admin);
  assert.equal(limited.code, 200);
  assert.equal(limited.data.source, 'school-records');
  assert.match(limited.data.text, /Maya River[\s\S]*temporarily unavailable/);

  // Photo/AI write boundaries: these calls use synthetic records and mocked private storage only.
  for (const route of ['admin/ai/scan', 'admin/ai/preview', 'admin/ai/apply']) {
    assert.equal((await api(route, 'POST', {}, learner)).code, 403);
    assert.equal((await api(route, 'POST', {})).code, 401);
  }
  assert.equal((await api('admin/ai/scan', 'POST', { mode: 'roster', image: { mimeType: 'image/svg+xml', data: 'PHN2Zz4=' } }, admin)).code, 400);
  providerOverride = { text: 'Review the proposed phone number update.', studentChanges: [{ targetId: student.id, fields: { guardianPhone: '+212600000002' } }], attendanceChanges: [] };
  const editReply = await api('campus-ai', 'POST', { conversationId: 'edit-thread-fixture', prompt: 'Change the guardian phone for STU-42 to +212600000002' }, admin);
  assert.equal(editReply.code, 200);
  assert.equal(editReply.data.proposal.studentChanges[0].targetId, student.id);
  assert.equal(privateState().students[0].guardianPhone, undefined, 'chat may propose but cannot write');
  providerOverride = { summary: 'Synthetic extracted row', rows: [{ studentId: '', firstName: 'سلمى', lastName: 'العلمي', className: '2AC-3', classNumber: '١٧', date: '', status: '', warning: '' }] };
  const scanned = await api('admin/ai/scan', 'POST', { mode: 'roster', language: 'ar', image: { mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6N0AAAAASUVORK5CYII=' } }, admin);
  assert.equal(scanned.code, 200);
  assert.equal(scanned.data.rows[0].classNumber, '1');
  assert.equal(privateState().students.length, 1, 'image extraction may not write');
  providerOverride = { rows: [{ firstName: 'Untrusted content', status: 'invented' }] };
  assert.equal((await api('admin/ai/scan', 'POST', { mode: 'roster', image: { mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6N0AAAAASUVORK5CYII=' } }, admin)).code, 502);
  assert.equal(privateState().students.length, 1);
  providerOverride = undefined;

  const scanRows = [{ studentId: 'MASSAR-FIXTURE-1', firstName: 'سلمى', lastName: 'العلمي', className: '2AC-3', classNumber: '١٧', date: '', status: '', warning: '' }];
  const draft = await api('admin/ai/preview', 'POST', { mode: 'roster', rows: scanRows }, admin);
  assert.equal(draft.code, 200);
  assert.equal(draft.data.proposal.studentChanges[0].fields.classNumber, '17');
  assert.equal(privateState().students.length, 1, 'preview must not write students');
  assert.equal((await api('admin/ai/apply', 'POST', { proposal: draft.data.proposal }, admin)).code, 400);
  const malicious = structuredClone(draft.data.proposal);
  malicious.studentChanges[0].fields.role = 'admin';
  assert.equal((await api('admin/ai/apply', 'POST', { proposal: malicious, confirmed: true }, admin)).code, 400);
  const applied = await api('admin/ai/apply', 'POST', { proposal: draft.data.proposal, confirmed: true }, admin);
  assert.equal(applied.code, 200);
  assert.equal(applied.data.state.students.length, 2);
  assert.equal((await api('admin/ai/apply', 'POST', { proposal: draft.data.proposal, confirmed: true }, admin)).data.replayed, true);
  assert.equal(privateState().students.length, 2);
  assert.equal((await api('admin/ai/preview', 'POST', { mode: 'roster', rows: scanRows }, admin)).data.proposal, null);
  // Weekly grid extraction is read-only; the exact lesson evidence survives the API and private storage.
  providerOverride = { summary: 'Synthetic weekly number grid', rows: [
    { studentId: 'must-be-ignored', firstName: 'Do not trust invented names', className: '', classNumber: '١٧', date: '2025-11-11', status: 'absent', period: '8-9' },
    { className: '', classNumber: '17', date: '2025-11-11', status: 'absent', period: '9-10' },
  ] };
  const weekly = await api('admin/ai/scan', 'POST', { mode: 'attendance', format: 'weekly', classHint: '2AC-3', image: { mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6N0AAAAASUVORK5CYII=' } }, admin);
  assert.equal(weekly.code, 200);
  assert.equal(weekly.data.rows[0].scope, 'lesson');
  assert.equal(weekly.data.rows[0].studentId, '');
  assert.equal(weekly.data.rows[0].className, '2AC-3');
  const weeklyDraft = await api('admin/ai/preview', 'POST', { mode: 'attendance', rows: weekly.data.rows }, admin);
  assert.equal(weeklyDraft.code, 200);
  assert.equal(weeklyDraft.data.proposal.attendanceChanges.length, 1);
  assert.deepEqual(weeklyDraft.data.proposal.attendanceChanges[0].absencePeriods, ['08:00-09:00', '09:00-10:00']);
  assert.equal((await api('admin/ai/apply', 'POST', { proposal: weeklyDraft.data.proposal, confirmed: true }, admin)).code, 200);
  assert.deepEqual(privateState().attendance.find((entry: any) => entry.studentId === 'MASSAR-FIXTURE-1').absencePeriods, ['08:00-09:00', '09:00-10:00']);
  assert.equal((await api('admin/ai/preview', 'POST', { mode: 'attendance', rows: weekly.data.rows }, admin)).data.proposal, null);
  providerOverride = undefined;
  const stale = { ...draft.data.proposal, id: 'stale-review-fixture' };
  assert.equal((await api('admin/ai/apply', 'POST', { proposal: stale, confirmed: true }, admin)).code, 409);
  assert.equal(privateState().auditEvents.some((entry: any) => entry.type === 'ai_student_changes_applied'), true);

  process.env.CAMPUS_ADMIN_SETUP_CODE = 'different-one-time-setup-code-for-local-test-987654';
  const retiredPassword = 'qa-owner-first-private-passphrase';
  process.env.CAMPUS_REJECTED_ADMIN_PASSWORD_SHA256 = digest(retiredPassword);
  assert.equal((await api('auth/login', 'POST', { username: 'qa_owner', password: retiredPassword, requireAdmin: true })).code, 401);
  const replacement = await api('auth/admin-setup', 'POST', {
    code: process.env.CAMPUS_ADMIN_SETUP_CODE, password: 'qa-owner-new-private-passphrase',
  });
  assert.equal(replacement.data.user.id, setup.data.user.id);
  const newAdmin = session(replacement);
  assert.equal((await api('admin/state', 'GET', undefined, admin)).code, 401);
  assert.equal((await api('admin/state', 'GET', undefined, secondary)).code, 401);
  assert.equal((await api('admin/state', 'GET', undefined, newAdmin)).data.state.students[0].id, student.id);
  assert.equal(privateState().users.find((user: any) => user.id === extra.data.user.id).disabledAt != null, true);

  assert.equal((await api('auth/logout', 'POST', {}, newAdmin)).code, 200);
  assert.equal((await api('auth/me', 'GET', undefined, newAdmin)).data.authenticated, false);
  assert.equal((await api('admin/state', 'GET', undefined, newAdmin)).code, 401);
});

test('temporary administrator passwords require a server-enforced change and cannot be replayed', async () => {
  const before = JSON.parse(blobs.get('campus-os/private/state.json')!.json);
  process.env.CAMPUS_ADMIN_SETUP_CODE = 'temporary-owner-one-time-code-fixture-123456789';
  process.env.CAMPUS_ADMIN_USERNAME = 'qa_temporary_owner';
  const initialPassword = 'Temp-123';
  process.env.CAMPUS_ADMIN_TEMPORARY_PASSWORD_HASH = await passwordHash(initialPassword);
  const setup = await api('auth/admin-setup', 'POST', {
    code: process.env.CAMPUS_ADMIN_SETUP_CODE, password: initialPassword,
  });
  assert.equal(setup.code, 200);
  assert.equal(setup.data.user.mustChangePassword, true);
  const initialSession = session(await api('auth/login', 'POST', {
    username: 'qa_temporary_owner', password: initialPassword, requireAdmin: true,
  }));
  assert.equal((await api('auth/me', 'GET', undefined, initialSession)).data.user.mustChangePassword, true);
  assert.equal((await api('admin/state', 'GET', undefined, initialSession)).code, 403);
  assert.equal((await api('campus-ai', 'GET', undefined, initialSession)).code, 403);
  assert.equal((await api('admin/students/export-excel', 'POST', { confirmed: true }, initialSession)).code, 403);
  assert.equal((await api('auth/admin-setup', 'POST', {
    code: process.env.CAMPUS_ADMIN_SETUP_CODE, password: initialPassword,
  })).code, 409);
  assert.equal((await api('auth/password', 'POST', {
    currentPassword: initialPassword, password: 'too-short',
  }, initialSession)).code, 400);
  const changed = await api('auth/password', 'POST', {
    currentPassword: initialPassword, password: 'qa-owner-new-private-password',
  }, initialSession);
  assert.equal(changed.code, 200);
  assert.equal(changed.data.user.mustChangePassword, undefined);
  const admin = session(changed);
  assert.equal((await api('admin/state', 'GET', undefined, initialSession)).code, 401);
  assert.equal((await api('admin/state', 'GET', undefined, admin)).code, 200);
  assert.equal((await api('auth/login', 'POST', {
    username: 'qa_temporary_owner', password: initialPassword, requireAdmin: true,
  })).code, 401);
  const after = JSON.parse(blobs.get('campus-os/private/state.json')!.json);
  assert.deepEqual(after.students, before.students);
  assert.deepEqual(after.attendance, before.attendance);
  assert.equal(after.users.filter((user: any) => user.role === 'admin' && !user.disabledAt).length, 1);
  delete process.env.CAMPUS_ADMIN_TEMPORARY_PASSWORD_HASH;
});

test('administrator profiles and saved attendance emails stay isolated and deduplicated', async () => {
  process.env.CAMPUS_ADMIN_SETUP_CODE = 'mail-owner-single-use-code-fixture-987654321';
  process.env.CAMPUS_ADMIN_USERNAME = 'qa_mail_owner';
  const setup = await api('auth/admin-setup', 'POST', { code: process.env.CAMPUS_ADMIN_SETUP_CODE, password: 'qa-mail-owner-private-password' });
  assert.equal(setup.code, 200);
  const owner = session(setup);
  const second = await api('admin/users', 'POST', {
    username: 'qa_mail_second', email: 'second-mail@example.invalid', displayName: 'Second Administrator',
    password: 'qa-mail-second-private-password', role: 'admin',
  }, owner);
  assert.equal(second.code, 201);
  const other = session(await api('auth/login', 'POST', {
    username: 'qa_mail_second', password: 'qa-mail-second-private-password', requireAdmin: true,
  }, undefined, {}, '192.0.2.60'));
  const { mutateState } = await import('../src/server/storage.js');
  await mutateState((db) => {
    db.adminProfile = { displayName: 'Legacy primary name', username: 'qa_mail_owner', email: '', role: 'Administrator' };
  });
  let state = (await api('admin/state', 'GET', undefined, owner)).data;
  assert.equal(state.state.adminProfile.username, 'qa_mail_owner');
  assert.equal(state.state.adminProfile.displayName, 'Legacy primary name');
  assert.equal((await api('admin/state', 'GET', undefined, other)).data.state.adminProfile.displayName, 'Second Administrator');
  const profile = await api('admin/state', 'PUT', {
    state: { adminProfile: { displayName: 'First Administrator', profilePictureUrl: '' } }, versions: state.versions,
  }, owner);
  assert.equal(profile.code, 200);
  assert.equal((await api('admin/state', 'GET', undefined, other)).data.state.adminProfile.displayName, 'Second Administrator');

  const mailStudent = { ...student, id: 'mail-student', studentId: 'MAIL-42', guardianContact: 'parent@example.invalid', notes: '' };
  state = (await api('admin/state', 'GET', undefined, owner)).data;
  const saved = await api('admin/state', 'PUT', { state: { students: [mailStudent] }, versions: state.versions }, owner);
  assert.equal(saved.code, 200);
  const normalized = (await api('admin/state', 'GET', undefined, owner)).data.state.students[0];
  assert.equal(studentContact(normalized).email, 'parent@example.invalid');
  assert.equal(studentContact(normalized).phone, '');
  process.env.EMAILJS_SERVICE_ID = 'fixture-service';
  process.env.EMAILJS_TEMPLATE_ID = 'fixture-template';
  process.env.EMAILJS_PUBLIC_KEY = 'fixture-public';
  const record = { id: 'mail-attendance', studentId: mailStudent.studentId, date: today, status: 'absent', updatedAt: new Date().toISOString() };
  state = (await api('admin/state', 'GET', undefined, owner)).data;
  assert.equal((await api('admin/state', 'PUT', { state: { attendance: [record] }, versions: state.versions }, owner)).code, 200);
  assert.equal(emailRequests.length, 1);
  assert.equal(emailRequests[0].template_params.to_email, 'parent@example.invalid');
  assert.match(emailRequests[0].template_params.notification_subject, /^Absence de Maya River/);
  assert.match(emailRequests[0].template_params.attendance_message, /classe de Form 2/);
  state = (await api('admin/state', 'GET', undefined, owner)).data;
  await api('admin/state', 'PUT', { state: { attendance: [record] }, versions: state.versions }, owner);
  assert.equal(emailRequests.length, 1, 'An ordinary save must not resend a notice');
  state = (await api('admin/state', 'GET', undefined, owner)).data;
  const late = { ...record, status: 'late', time: '08:12', updatedAt: new Date(Date.now() + 1000).toISOString() };
  await api('admin/state', 'PUT', { state: { attendance: [late] }, versions: state.versions }, owner);
  assert.equal(emailRequests.length, 2);
  assert.match(emailRequests[1].template_params.notification_subject, /^Retard de/);
  assert.match(emailRequests[1].template_params.attendance_message, /en retard.*08:12/);
  assert.doesNotMatch(emailRequests[1].template_params.attendance_message, /signalé\(e\) absent/);
  const statuses = (await api('admin/attendance-emails', 'GET', undefined, owner)).data.notifications;
  assert.equal(statuses.filter((job: any) => job.status === 'sent').length, 2);
  await api('admin/attendance-emails', 'POST', { studentId: mailStudent.studentId, date: today }, owner);
  assert.equal(emailRequests.length, 2);
  assert.equal((await api('admin/attendance-emails')).code, 401);
  assert.equal((await api('cron/attendance-emails')).code, 401);

  const { dispatchAttendanceEmails } = await import('../src/server/attendanceEmail.js');
  await mutateState((db) => {
    const job = db.attendanceEmails.find((job) => job.attendanceStatus === 'late')!;
    job.status = 'pending'; job.retryAt = 0;
  });
  emailResponse = 0;
  await Promise.all([dispatchAttendanceEmails(), dispatchAttendanceEmails()]);
  assert.equal(emailRequests.length, 3, 'Concurrent processors must acquire one server-side delivery lease');
  assert.equal((await api('admin/attendance-emails', 'GET', undefined, owner)).data.notifications.find((job: any) => job.attendanceStatus === 'late').status, 'uncertain');
  assert.equal(emailRequests.length, 3, 'An uncertain delivery must not be retried automatically');
  assert.equal((await api('admin/attendance-emails', 'POST', { studentId: mailStudent.studentId, date: today, retry: true }, owner)).code, 400);
  emailResponse = 200;
  assert.equal((await api('admin/attendance-emails', 'POST', { studentId: mailStudent.studentId, date: today, retry: true, confirmed: true }, owner)).code, 200);
  assert.equal(emailRequests.length, 4);
  await mutateState((db) => {
    const job = db.attendanceEmails.find((job) => job.attendanceStatus === 'late')!;
    job.status = 'pending'; job.retryAt = 0;
    db.attendance = db.attendance.map((row) => ({ ...row, status: 'present' }));
  });
  await dispatchAttendanceEmails();
  assert.equal(emailRequests.length, 4, 'Correcting attendance must cancel a pending notice');
  assert.equal((await api('admin/attendance-emails', 'GET', undefined, owner)).data.notifications.find((job: any) => job.attendanceStatus === 'late').status, 'cancelled');
  const yesterday = new Date(today + 'T00:00:00Z');
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const pastDate = yesterday.toISOString().slice(0, 10);
  await mutateState((db) => {
    db.attendance.push({ ...record, id: 'older-record', date: pastDate, status: 'absent' });
    db.attendanceEmails.push({ id: digest([mailStudent.id, pastDate, 'absent'].join('\n')), studentId: mailStudent.studentId,
      date: pastDate, attendanceStatus: 'absent', status: 'failed', attempts: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  });
  assert.equal((await api('admin/attendance-emails', 'POST', {
    studentId: mailStudent.studentId, date: pastDate, retry: true, confirmed: true,
  }, owner)).code, 200);
  assert.equal(emailRequests.length, 5, 'A failed recorded notice can be retried after the school date changes');
  const targetId = digest([mailStudent.id, pastDate, 'absent'].join('\n'));
  await mutateState((db) => {
    db.attendance = db.attendance.map((row) => ({ ...row, status: 'absent' }));
    for (const job of db.attendanceEmails.filter((job) => job.attendanceStatus === 'absent')) {
      job.status = 'pending'; job.retryAt = 0;
    }
  });
  process.env.CRON_SECRET = 'isolated-scheduler-fixture';
  const authorization = { authorization: 'Bearer ' + process.env.CRON_SECRET };
  assert.equal((await api('cron/attendance-emails?notice=invalid', 'GET', undefined, undefined, authorization)).code, 400);
  assert.equal((await api('cron/attendance-emails?notice=' + targetId, 'GET', undefined, undefined, authorization)).code, 200);
  assert.equal(emailRequests.length, 6, 'A scoped retry sends only the selected notice');
  const remaining = JSON.parse(blobs.get('campus-os/private/state.json')!.json).attendanceEmails;
  assert.equal(remaining.find((job: any) => job.date === today && job.attendanceStatus === 'absent').status, 'pending');
  delete process.env.CRON_SECRET;
  assert.equal((await api('auth/logout', 'POST', {}, owner)).code, 200);
  assert.equal((await api('auth/me', 'GET', undefined, owner)).data.authenticated, false);
  assert.equal((await api('auth/me', 'GET', undefined, other)).data.user.username, 'qa_mail_second');
  for (const key of ['EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY']) delete process.env[key];
});

test('distributed rate counters survive separate requests and reject oversized bodies', async () => {
  for (let attempt = 1; attempt <= 12; attempt++) {
    assert.equal((await api('auth/login', 'POST', {}, undefined, {}, '192.0.2.202')).code, 400);
  }
  const rejected = await api('auth/login', 'POST', {}, undefined, {}, '192.0.2.202');
  assert.equal(rejected.code, 429);
  assert.ok(Number(rejected.headers['retry-after']) > 0);
  assert.ok([...blobs.keys()].some((key) => key.includes('/limits/login/')));
  assert.equal((await api('auth/login', 'POST', { password: 'x'.repeat(9000) })).code, 413);
});
