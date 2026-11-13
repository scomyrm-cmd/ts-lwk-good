import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyStudentProposal, makeProposal, numberRosterRows, parseScanRows, prepareScan, recordVersions } from '../src/server/studentOperations.js';
import { authorizedStudentContext, validatedImage } from '../src/server/documentScanner.js';
import { emailParameters } from '../src/server/attendanceEmail.js';
import { schoolDate } from '../src/server/records.js';
import { classLabel, latinDigits, sortClasses } from '../src/utils/moroccanClasses.js';
import type { SchoolState, Account } from '../src/server/storage.js';

const admin: Account = { id: 'admin', role: 'admin', username: 'fixture', displayName: 'Fixture Admin', email: 'fixture@example.invalid', passwordHash: 'never-sent', createdAt: '2026-01-01', sessionVersion: 1 };
const student = { id: 'record-1', studentId: 'MASSAR-1', firstName: 'سلمى', lastName: 'العلمي', className: '2AC-3', classNumber: '17', guardianEmail: 'guardian@example.invalid', createdAt: '2026-09-01' };
const row = { studentId: '', firstName: 'سلمى', lastName: 'العلمي', className: '2AC-3', classNumber: '١٧', date: schoolDate(), status: 'absent', warning: '' };
function fixture(): SchoolState { return { users: [admin], students: [student], attendance: [], reports: [], lostFoundItems: [], activities: [], notifications: [], conversations: [], sessions: [], auditEvents: [], attendanceEmails: [] }; }

test('Moroccan class ordering and Arabic digits preserve student identity', () => {
  assert.equal(latinDigits('١٧ ۰۸ X٠٠١'), '17 08 X001');
  assert.equal(classLabel('2AC-3', 'fr'), '2e année collège · 3');
  assert.deepEqual(['2BAC-1', '3AC-2', '1AP-1', '2AC-10', '2AC-2'].sort(sortClasses), ['1AP-1', '2AC-2', '2AC-10', '3AC-2', '2BAC-1']);
});

test('scan review matches roll plus class, preserves contacts, and never writes or queues mail', () => {
  const db = fixture(), before = JSON.stringify(db);
  const proposal = prepareScan(db, [row], 'attendance')!;
  assert.equal(proposal.studentChanges.length, 0);
  assert.equal(proposal.attendanceChanges[0].studentId, 'MASSAR-1');
  assert.equal(JSON.stringify(db), before);
  const result = applyStudentProposal(db, admin, { proposal, confirmed: true });
  assert.equal(result.queued, 1);
  assert.equal(db.attendanceEmails.length, 1);
  assert.equal(db.students[0].guardianEmail, student.guardianEmail);
  assert.equal(db.attendance[0].status, 'absent');
  assert.equal(applyStudentProposal(db, admin, { proposal, confirmed: true }).replayed, true);
  assert.equal(db.attendance.length, 1);
  assert.equal(db.attendanceEmails.length, 1);
  assert.equal(db.activities.length, 1);
  assert.equal(db.auditEvents[0].actorId, admin.id);
});

test('historical attendance never schedules a new guardian email; re-import does not duplicate attendance', () => {
  const db = fixture();
  const proposal = prepareScan(db, [{ ...row, date: '2025-03-01' }], 'attendance')!;
  assert.equal(applyStudentProposal(db, admin, { proposal, confirmed: true }).queued, 0);
  const repeated = prepareScan(db, [{ ...row, date: '2025-03-01' }], 'attendance')!;
  assert.equal(repeated, undefined);
  assert.equal(db.attendance.length, 1);
  assert.equal(db.attendanceEmails.length, 0);
});

test('a roster without Massar creates a LOCAL identifier and repeat imports are a no-op', () => {
  const db = fixture(); db.students = [];
  const proposal = prepareScan(db, [{ ...row, date: '', status: '' }], 'roster')!;
  assert.match(proposal.studentChanges[0].fields.studentId!, /^LOCAL-/);
  applyStudentProposal(db, admin, { proposal, confirmed: true });
  assert.equal(db.students.length, 1);
  assert.equal(db.attendance.length, 0);
  assert.equal(prepareScan(db, [row], 'roster'), undefined);
});

test('scan conflicts, duplicates, missing dates and unknown marks require correction', () => {
  const db = fixture();
  for (const bad of [
    { ...row, className: '' }, { ...row, lastName: 'Other' }, { ...row, date: '' }, { ...row, status: '' },
    { ...row, date: '2026-02-30' }, { ...row, studentId: 'DIFFERENT-ID' }, { ...row, studentId: 'MASSAR-1', className: '3AC-1' },
  ]) assert.throws(() => prepareScan(db, [bad], 'attendance'));
  assert.throws(() => prepareScan(db, [row, row], 'attendance'), /duplicate student row/);
});

test('editing student IDs retains attendance history and outbox deduplication', () => {
  const db = fixture();
  applyStudentProposal(db, admin, { proposal: prepareScan(db, [row], 'attendance'), confirmed: true });
  const jobId = db.attendanceEmails[0].id;
  const proposal = makeProposal(db, { studentChanges: [{ targetId: student.id, fields: { studentId: 'UPDATED-ID', guardianPhone: '+212600000000' } }], attendanceChanges: [] })!;
  applyStudentProposal(db, admin, { proposal, confirmed: true });
  assert.equal(db.students[0].studentId, 'UPDATED-ID');
  assert.equal(db.attendance[0].studentId, 'UPDATED-ID');
  assert.equal(db.attendanceEmails[0].studentId, 'UPDATED-ID');
  assert.equal(db.attendanceEmails[0].id, jobId);
  assert.equal(db.attendanceEmails.length, 1);
});

test('invalid batches cannot partially write and stale proposals cannot overwrite another administrator', () => {
  const db = fixture();
  const proposal = makeProposal(db, { studentChanges: [{ targetId: student.id, fields: { guardianEmail: 'new@example.invalid' } }], attendanceChanges: [] })!;
  const original = JSON.stringify(db);
  const invalid = { ...proposal, attendanceChanges: [{ studentId: 'not-a-student', date: '2026-11-12', status: 'absent' }] };
  assert.throws(() => applyStudentProposal(db, admin, { proposal: invalid, confirmed: true }), /existing or newly imported/);
  assert.equal(JSON.stringify(db), original);
  db.students = [{ ...student, guardianPhone: '+212600000001' }];
  assert.throws(() => applyStudentProposal(db, admin, { proposal, confirmed: true }), /changed since this preview/);
  assert.equal(db.students[0].guardianPhone, '+212600000001');
});

test('AI changes reject role escalation, missing confirmation, invalid email, and unknown fields', () => {
  const db = fixture();
  const raw = { id: 'operation-fixture', versions: recordVersions(db), studentChanges: [{ targetId: student.id, fields: { notes: 'Updated' } }], attendanceChanges: [] };
  assert.throws(() => applyStudentProposal(db, { ...admin, role: 'user' }, { proposal: raw, confirmed: true }), /Administrator/);
  assert.throws(() => applyStudentProposal(db, admin, { proposal: raw }), /confirm/);
  for (const fields of [{ role: 'admin' }, { passwordHash: 'bad' }, { guardianEmail: 'invalid' }, { id: 'overwrite' }]) {
    assert.throws(() => makeProposal(db, { studentChanges: [{ targetId: student.id, fields }], attendanceChanges: [] }));
  }
  applyStudentProposal(db, admin, { proposal: raw, confirmed: true });
  assert.throws(() => applyStudentProposal(db, admin, { proposal: { ...raw, studentChanges: [{ targetId: student.id, fields: { notes: 'Other' } }] }, confirmed: true }), /already used/);
});

test('all student records reach the authorized context; credentials and unrelated records never do', () => {
  const db = fixture();
  db.students.push({ ...student, id: 'record-2', studentId: 'MASSAR-2', firstName: 'Adam', classNumber: '18' });
  const context = authorizedStudentContext(db);
  assert.equal(context.students.length, 2);
  assert.equal(context.students[0].guardianEmail, student.guardianEmail);
  assert.equal(JSON.stringify(context).includes('never-sent'), false);
  assert.deepEqual(Object.keys(context).sort(), ['attendance', 'students']);
});

test('photo validation rejects spoofed image MIME types and oversized payloads', () => {
  assert.throws(() => validatedImage({ mimeType: 'image/png', data: Buffer.from('<script>not an image</script>').toString('base64') }));
  assert.throws(() => validatedImage({ mimeType: 'image/svg+xml', data: 'AAAA' }));
  assert.throws(() => validatedImage({ mimeType: 'image/jpeg', data: 'A'.repeat(3_500_004) }));
});

test('roster numbering follows photographed order and keeps unreadable rows in place', () => {
  const rows = parseScanRows([{ ...row, firstName: 'Zineb' }, { ...row, firstName: '', warning: 'Unreadable' }, { ...row, firstName: 'Adam' }]);
  const numbered = numberRosterRows(rows);
  assert.deepEqual(numbered.map(item => [item.firstName, item.classNumber]), [['Zineb', '1'], ['', '2'], ['Adam', '3']]);
  assert.deepEqual(numberRosterRows(rows, 21).map(item => item.classNumber), ['21', '22', '23']);
  assert.throws(() => numberRosterRows(rows, 0));
  assert.throws(() => prepareScan(fixture(), numbered, 'roster'), /first name/);
  assert.equal(classLabel('2APIC-6', 'en'), 'Collège year 2 · international · 6');
});

const lesson = { ...row, firstName: '', lastName: '', classNumber: '٠١٧', scope: 'lesson', period: '8-9', date: '2026-11-11' };
test('weekly number-only cells resolve by class, merge lessons, preserve dates and deduplicate rescans', () => {
  const db = fixture();
  db.students.push({ ...student, id: 'other-class', studentId: 'OTHER-ID', className: '3AC-1' });
  const proposal = prepareScan(db, [lesson, { ...lesson, period: '٩–١٠' }, lesson, { ...lesson, date: '2026-11-12', period: '14-15' }], 'attendance')!;
  assert.equal(proposal.studentChanges.length, 0);
  assert.deepEqual(proposal.attendanceChanges.map(change => [change.studentId, change.date, change.absencePeriods]), [
    ['MASSAR-1', '2026-11-11', ['08:00-09:00', '09:00-10:00']], ['MASSAR-1', '2026-11-12', ['14:00-15:00']],
  ]);
  applyStudentProposal(db, admin, { proposal, confirmed: true });
  assert.equal(db.attendance.length, 2);
  assert.equal(db.students.length, 2);
  assert.equal(prepareScan(db, [lesson], 'attendance'), undefined);
  const added = prepareScan(db, [{ ...lesson, period: '10-11' }], 'attendance')!;
  assert.deepEqual(added.attendanceChanges[0].absencePeriods, ['08:00-09:00', '09:00-10:00', '10:00-11:00']);
  applyStudentProposal(db, admin, { proposal: added, confirmed: true });
  assert.equal(db.attendance.length, 2);
  assert.deepEqual(authorizedStudentContext(db).attendance.find(entry => entry.date === '2026-11-12')?.absencePeriods, ['14:00-15:00']);
});

test('unknown rolls, missing class/date/period and unresolved marks cannot create students or absences', () => {
  const db = fixture(), before = JSON.stringify(db);
  for (const bad of [{ ...lesson, classNumber: '99' }, { ...lesson, className: '' }, { ...lesson, date: '' },
    { ...lesson, period: '' }, { ...lesson, period: '25-26' }, { ...lesson, period: '9-8' }, { ...lesson, status: '' },
    { ...lesson, status: 'present' }, { ...lesson, studentId: 'UNKNOWN' }, { ...lesson, firstName: 'Wrong name' }]) {
    assert.throws(() => prepareScan(db, [bad], 'attendance'));
  }
  assert.equal(JSON.stringify(db), before);
  assert.throws(() => prepareScan(db, [], 'attendance'));
});

test('lesson scans retain unrelated days, reason and notes and never narrow an existing whole-day absence', () => {
  const db = fixture();
  applyStudentProposal(db, admin, { proposal: makeProposal(db, { studentChanges: [], attendanceChanges: [
    { studentId: student.studentId, date: lesson.date, status: 'absent', reason: 'Contact pending', notes: 'Keep me' },
  ] }), confirmed: true });
  assert.equal(prepareScan(db, [lesson], 'attendance'), undefined);
  assert.equal(db.attendance[0].notes, 'Keep me');
  const change = makeProposal(db, { studentChanges: [], attendanceChanges: [{ studentId: student.studentId, date: lesson.date, status: 'absent', absencePeriods: ['08:00-09:00'] }] })!;
  applyStudentProposal(db, admin, { proposal: change, confirmed: true });
  assert.equal(db.attendance[0].reason, 'Contact pending');
  assert.equal(db.attendance[0].notes, 'Keep me');
  const present = makeProposal(db, { studentChanges: [], attendanceChanges: [{ studentId: student.studentId, date: lesson.date, status: 'present' }] })!;
  applyStudentProposal(db, admin, { proposal: present, confirmed: true });
  assert.deepEqual(db.attendance[0].absencePeriods, []);
});

test('today’s lesson absences queue one notice and existing EmailJS template variables retain lesson context', () => {
  const db = fixture();
  const proposal = prepareScan(db, [{ ...lesson, date: schoolDate() }, { ...lesson, date: schoolDate(), period: '9-10' }], 'attendance')!;
  applyStudentProposal(db, admin, { proposal, confirmed: true });
  assert.equal(db.attendanceEmails.length, 1);
  const params = emailParameters(db, db.students[0], db.attendance[0]);
  assert.equal(params.attendance_periods, '08:00–09:00, 09:00–10:00');
  assert.match(params.attendance_date, /pendant les cours de 08:00/);
  assert.match(params.attendance_message, /pendant les cours de 08:00/);
  assert.equal(prepareScan(db, [{ ...lesson, date: schoolDate() }], 'attendance'), undefined);
  assert.equal(db.attendanceEmails.length, 1);
});

test('HEIC is accepted by file signature while a renamed text file is rejected', () => {
  const bytes = Buffer.alloc(64); bytes.writeUInt32BE(24, 0); bytes.write('ftypheic', 4); bytes.write('mif1heic', 16);
  assert.equal(validatedImage({ mimeType: 'image/heic', data: bytes.toString('base64') }).mimeType, 'image/heic');
  assert.throws(() => validatedImage({ mimeType: 'image/heic', data: Buffer.from('A'.repeat(64)).toString('base64') }));
});
