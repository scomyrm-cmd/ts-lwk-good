import { randomUUID } from 'node:crypto';
import type { AIProposal, AIStudentChange, AIAttendanceChange, ScanRow, Student } from '../types/index.js';
import { latinDigits } from '../utils/moroccanClasses.js';
import { applyUpdates, attendanceStatuses, isoDate, versionOf } from './records.js';
import { digest, field, choice, object, HttpError } from './security.js';
import { addAuditEvent, type Account, type SchoolState } from './storage.js';
import { queueChangedAttendanceEmails } from './attendanceEmail.js';

export const studentFieldNames = ['studentId', 'firstName', 'lastName', 'className', 'classNumber', 'gender', 'dateOfBirth', 'guardianEmail', 'guardianPhone', 'guardianContact', 'notes'] as const;
const limits = { studentId: 120, firstName: 120, lastName: 120, className: 120, classNumber: 20, gender: 10, dateOfBirth: 10, guardianEmail: 160, guardianPhone: 80, guardianContact: 220, notes: 4000 };
const normalize = (value: string) => latinDigits(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const rollKey = (value: string) => normalize(value).replace(/^0+(?=\d)/, '');
const nameKey = (student: Pick<Student, 'firstName' | 'lastName'>) => normalize(student.firstName + ' ' + student.lastName);

export function recordVersions(db: SchoolState) {
  return { students: versionOf(db.students), attendance: versionOf(db.attendance) };
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 150) throw new HttpError(400, 'Use at most 150 changes per batch');
  return value;
}

export function parseChanges(value: unknown): Pick<AIProposal, 'studentChanges' | 'attendanceChanges'> {
  const raw = object(value);
  const studentChanges: AIStudentChange[] = list(raw.studentChanges).map(entry => {
    const row = object(entry), fields = object(row.fields);
    if (!Object.keys(fields).length || Object.keys(fields).some(key => !studentFieldNames.includes(key as typeof studentFieldNames[number]))) {
      throw new HttpError(400, 'Only student record fields can be changed');
    }
    return { targetId: field(row.targetId, 120), fields: Object.fromEntries(Object.entries(fields).map(([key, value]) =>
      [key, field(value, limits[key as keyof typeof limits])])) };
  });
  const attendanceChanges: AIAttendanceChange[] = list(raw.attendanceChanges).map(entry => {
    const row = object(entry);
    if (Object.keys(row).some(key => !['studentId', 'date', 'status', 'reason', 'notes'].includes(key))) throw new HttpError(400, 'Invalid attendance field');
    return { studentId: field(row.studentId, 120, true), date: isoDate(row.date), status: choice(row.status, attendanceStatuses),
      ...(row.reason != null && { reason: field(row.reason, 1000) }), ...(row.notes != null && { notes: field(row.notes, 4000) }) };
  });
  return { studentChanges, attendanceChanges };
}

export function makeProposal(db: SchoolState, value: unknown): AIProposal | undefined {
  const changes = parseChanges(value);
  if (!changes.studentChanges.length && !changes.attendanceChanges.length) return undefined;
  // Validate a copy before presenting a proposed edit. This never writes or queues mail.
  const proposal = { id: randomUUID(), ...changes, versions: recordVersions(db) };
  planChanges(db, proposal);
  return proposal;
}

export function planChanges(db: SchoolState, proposal: Pick<AIProposal, 'studentChanges' | 'attendanceChanges'>) {
  let students = [...db.students];
  let attendance = [...db.attendance];
  const renamed = new Map<string, string>();
  const touched = new Set<string>();
  const now = new Date().toISOString();
  for (const change of proposal.studentChanges) {
    const old = change.targetId ? students.find(student => student.id === change.targetId) : undefined;
    if (change.targetId && !old) throw new HttpError(409, 'A student no longer exists. Generate a fresh preview.');
    const key = old?.id || String(change.fields.studentId);
    if (touched.has(key)) throw new HttpError(400, 'A student appears twice in this batch');
    touched.add(key);
    const next = { ...(old ?? { id: randomUUID(), createdAt: now }), ...change.fields } as Student;
    if (old && next.studentId !== old.studentId) renamed.set(old.studentId, next.studentId);
    students = old ? students.map(row => row.id === old.id ? next : row) : [...students, next];
  }
  if (renamed.size) attendance = attendance.map(row => renamed.has(row.studentId) ? { ...row, studentId: renamed.get(row.studentId)! } : row);
  const attendanceKeys = new Set<string>();
  for (const change of proposal.attendanceChanges) {
    if (!students.some(student => student.studentId === change.studentId)) throw new HttpError(400, 'Attendance must refer to an existing or newly imported student');
    const key = `${change.studentId}/${change.date}`;
    if (attendanceKeys.has(key)) throw new HttpError(400, 'A student has two attendance entries for the same date');
    attendanceKeys.add(key);
    const old = attendance.find(row => row.studentId === change.studentId && row.date === change.date);
    const next = { ...old, ...change, id: old?.id || randomUUID(), updatedAt: now };
    attendance = [...attendance.filter(row => row.studentId !== change.studentId || row.date !== change.date), next];
  }
  // Reuse the authoritative validation rules, including unique student IDs, dates and guardian email.
  const candidate = { ...db };
  applyUpdates(candidate, { students, attendance }, recordVersions(db));
  const rolls = new Set<string>();
  for (const student of candidate.students) {
    if (!student.classNumber) continue;
    const key = normalize(student.className) + '/' + rollKey(student.classNumber);
    if (rolls.has(key)) throw new HttpError(400, 'Two students have the same roll number in this class');
    rolls.add(key);
  }
  return { students: candidate.students, attendance: candidate.attendance, renamed };
}

export function applyStudentProposal(db: SchoolState, account: Account, input: unknown) {
  if (account.role !== 'admin' || account.mustChangePassword || account.disabledAt) throw new HttpError(403, 'Administrator permission required');
  if (db.settings?.aiAssistant?.enabled === false) throw new HttpError(403, 'Campus AI is disabled in settings');
  const body = object(input);
  if (body.confirmed !== true) throw new HttpError(400, 'Review and confirm the changes before saving');
  const raw = object(body.proposal);
  const id = field(raw.id, 120, true);
  if (!/^[\w-]+$/.test(id)) throw new HttpError(400, 'Invalid operation identifier');
  const changes = parseChanges(raw);
  if (!changes.studentChanges.length && !changes.attendanceChanges.length) throw new HttpError(400, 'No changes selected');
  const hash = digest(JSON.stringify(changes));
  const previous = db.aiOperations?.find(operation => operation.id === id);
  if (previous) {
    if (previous.actorId !== account.id || previous.hash !== hash) throw new HttpError(409, 'This operation was already used for different changes');
    return { queued: 0, replayed: true };
  }
  const versions = object(raw.versions);
  if (versions.students !== versionOf(db.students) || versions.attendance !== versionOf(db.attendance)) {
    throw new HttpError(409, 'Student records changed since this preview. Reopen the scan or ask AI again before saving.');
  }
  const next = planChanges(db, changes);
  const oldAttendance = db.attendance.map(row => next.renamed.has(row.studentId) ? { ...row, studentId: next.renamed.get(row.studentId)! } : row);
  db.students = next.students;
  db.attendance = next.attendance;
  for (const notice of db.attendanceEmails) {
    if (next.renamed.has(notice.studentId)) notice.studentId = next.renamed.get(notice.studentId)!;
  }
  const now = new Date().toISOString();
  db.studentsLastSaved = now;
  db.activities.unshift({ id: randomUUID(), actionType: changes.studentChanges.length ? 'student_edited' : 'attendance_updated',
    description: `Campus AI: ${changes.studentChanges.length} student changes, ${changes.attendanceChanges.length} attendance changes reviewed and saved.`,
    administrator: account.displayName, timestamp: now });
  db.activities = db.activities.slice(0, 500);
  db.aiOperations = [...(db.aiOperations ?? []), { id, actorId: account.id, hash, at: now }].slice(-1000);
  addAuditEvent(db, account.id, 'ai_student_changes_applied');
  const queued = queueChangedAttendanceEmails(db, oldAttendance);
  return { queued, replayed: false };
}

export function parseScanRows(value: unknown): ScanRow[] {
  return list(value).map(entry => {
    const row = object(entry);
    return { studentId: latinDigits(field(row.studentId, 120)), firstName: field(row.firstName, 120), lastName: field(row.lastName, 120),
      className: latinDigits(field(row.className, 120)), classNumber: latinDigits(field(row.classNumber, 20)),
      date: row.date ? isoDate(row.date) : '', status: row.status ? choice(row.status, attendanceStatuses) : '', warning: field(row.warning, 500) };
  });
}

export function prepareScan(db: SchoolState, value: unknown, mode: 'roster' | 'attendance') {
  const rows = parseScanRows(value);
  if (!rows.length) throw new HttpError(400, 'No student rows found. Try a clearer photo.');
  const studentChanges: AIStudentChange[] = [], attendanceChanges: AIAttendanceChange[] = [];
  const seen = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const fail = (reason: string): never => { throw new HttpError(400, `Row ${index + 1}: ${reason}`); };
    if (!row.firstName || !row.lastName || !row.className) fail('check the first name, family name and class.');
    if (!row.studentId && !row.classNumber) fail('enter a Massar/student ID or class roll number.');
    const candidates = db.students.filter(student => row.studentId ? normalize(student.studentId) === normalize(row.studentId)
      : normalize(student.className) === normalize(row.className) &&
        (nameKey(student) === nameKey(row) || (student.classNumber && rollKey(student.classNumber) === rollKey(row.classNumber))));
    if (candidates.length > 1) fail('several students match. Enter the exact student ID.');
    const existing = candidates[0];
    if (existing && (nameKey(existing) !== nameKey(row) || normalize(existing.className) !== normalize(row.className))) {
      fail('the name or class conflicts with this student number. Correct the row or edit that student separately.');
    }
    if (!existing && db.students.some(student => nameKey(student) === nameKey(row) && normalize(student.className) === normalize(row.className))) {
      fail('this name already exists in the class with another ID. Use the existing student ID.');
    }
    if (existing?.classNumber && row.classNumber && rollKey(existing.classNumber) !== rollKey(row.classNumber)) fail('the roll number conflicts with the saved record.');
    const studentId = existing?.studentId || row.studentId || `LOCAL-${digest(normalize(row.className) + '/' + rollKey(row.classNumber)).slice(0, 12).toUpperCase()}`;
    if (seen.has(studentId)) fail('duplicate student row. Keep one entry per student and scan one date at a time.');
    seen.add(studentId);
    if (!existing) studentChanges.push({ targetId: '', fields: { studentId, firstName: row.firstName, lastName: row.lastName, className: row.className, classNumber: row.classNumber } });
    else if (row.classNumber && !existing.classNumber) studentChanges.push({ targetId: existing.id, fields: { classNumber: row.classNumber } });
    if (mode === 'attendance') {
      if (!row.date || !row.status) fail('choose the recorded date and status; blank marks are not absences.');
      attendanceChanges.push({ studentId, date: row.date, status: row.status as AIAttendanceChange['status'] });
    }
  }
  return makeProposal(db, { studentChanges, attendanceChanges });
}
