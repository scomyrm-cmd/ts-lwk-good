import { periodLabels } from '../utils/lessonPeriods.js';
import { randomUUID } from 'node:crypto';
import { waitUntil } from '@vercel/functions';
import type { AttendanceRecord, Student } from '../types/index.js';
import { schoolDate } from '../utils/dates.js';
import { isEmailAddress, studentContact } from '../utils/studentContact.js';
import { digest, HttpError } from './security.js';
import { indexAttendance } from './studentFacts.js';
import { mutateState, readState, type AttendanceEmail, type SchoolState } from './storage.js';

export function emailConfigured() {
  return Boolean(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY &&
    (process.env.VERCEL_ENV !== 'preview' || process.env.EMAILJS_ALLOW_PREVIEW === 'true'));
}

function noticeId(student: Student, date: string, status: string) {
  return digest([student.id, date, status].join('\n'));
}

export function enqueueAttendanceEmail(db: SchoolState, studentId: string, date: string) {
  const student = db.students.find((row) => row.studentId === studentId);
  if (!student) throw new HttpError(404, 'Student not found');
  if (!isEmailAddress(studentContact(student).email)) throw new HttpError(400, 'Add a valid guardian email to this student first');
  const record = indexAttendance(db.attendance).get(studentId)?.get(date);
  if (!record || (record.status !== 'absent' && record.status !== 'late')) throw new HttpError(400, 'The student must be marked absent or late today');
  const id = noticeId(student, date, record.status);
  const previous = db.attendanceEmails.find((job) => job.id === id);
  if (previous && previous.status !== 'cancelled') return previous;
  if (date !== schoolDate(db.settings?.timeZone)) throw new HttpError(400, 'New email notices are available for today’s attendance');
  const now = new Date().toISOString();
  const job: AttendanceEmail = {
    id, studentId, date, attendanceStatus: record.status, status: 'pending', createdAt: now, updatedAt: now,
    attempts: 0, retryAt: Date.now() + 2000,
  };
  if (previous) Object.assign(previous, job);
  else db.attendanceEmails.push(job);
  return previous ?? job;
}

export function queueChangedAttendanceEmails(db: SchoolState, previous: AttendanceRecord[]) {
  const date = schoolDate(db.settings?.timeZone);
  const before = indexAttendance(previous);
  const after = indexAttendance(db.attendance);
  let queued = 0;
  for (const student of db.students) {
    const record = after.get(student.studentId)?.get(date);
    if (!record || (record.status !== 'absent' && record.status !== 'late') || !isEmailAddress(studentContact(student).email)) continue;
    const old = before.get(student.studentId)?.get(date);
    if (old?.status === record.status && old.updatedAt === record.updatedAt) continue;
    enqueueAttendanceEmail(db, student.studentId, date);
    queued++;
  }
  return queued;
}

export function emailParameters(db: SchoolState, student: Student, record: AttendanceRecord) {
  const name = [student.firstName, student.lastName].join(' ').replace(/[\r\n]/g, ' ').trim();
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(record.date + 'T12:00:00Z'));
  const school = db.schoolInfo?.name || 'L’établissement scolaire';
  const absent = record.status === 'absent';
  const periods = absent ? periodLabels(record.absencePeriods) : '';
  const absenceDate = date + (periods ? ' pendant les cours de ' + periods : '');
  const subject = (absent ? 'Absence de ' : 'Retard de ') + name + ' — ' + date;
  const message = [
    'Madame, Monsieur,',
    `Nous vous informons que votre enfant ${name}, scolarisé(e) en classe de ${student.className}, a été signalé(e) ${absent ? 'absent(e)' : 'en retard'} le ${absenceDate}${!absent && record.time ? ' à ' + record.time : ''}.`,
    absent && !record.reason?.trim()
      ? 'À ce jour, aucune justification concernant cette absence n’a été enregistrée. Nous vous prions de bien vouloir nous en communiquer le motif dans les meilleurs délais.'
      : 'Pour toute précision concernant ce signalement, nous vous invitons à contacter l’administration scolaire.',
    'Nous vous remercions de votre compréhension et de votre collaboration.',
    'Cordialement,\nL’Administration Scolaire\n' + school + '\nService de suivi des absences et des retards',
  ].join('\n\n');
  const replyTo = db.schoolInfo?.email?.trim();
  return {
    to_email: studentContact(student).email, student_name: name, class_name: student.className,
    attendance_date: absenceDate, attendance_date_only: date, attendance_periods: periods, attendance_status: absent ? 'absent(e)' : 'en retard', attendance_time: record.time || '',
    school_name: school, notification_subject: subject, attendance_message: message,
    email: replyTo && isEmailAddress(replyTo) ? replyTo : '',
  };
}

function providerError(status: number, text: string) {
  if (status >= 500) return 'EmailJS could not confirm delivery. Check EmailJS history before retrying';
  if (/non-browser/i.test(text)) return 'Enable non-browser API requests in EmailJS Account → Security';
  if (/private key|access.?token/i.test(text)) return 'Set EMAILJS_PRIVATE_KEY in the Vercel production environment';
  if (/quota|limit.*month/i.test(text)) return 'EmailJS sending quota reached';
  if (status === 422) return 'EmailJS rejected the recipient or template fields';
  if (status === 429) return 'EmailJS rate limit reached. Delivery will be retried';
  return 'EmailJS rejected the request (HTTP ' + status + '). Check the service and template settings';
}

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function dispatchAttendanceEmails(notice?: string) {
  if (!emailConfigured()) return;
  const snapshot = await readState();
  if (!snapshot.attendanceEmails.some((job) => (!notice || job.id === notice) && (
    (job.status === 'pending' && (job.retryAt || 0) <= Date.now() + 2000) ||
    (job.status === 'sending' && (snapshot.emailDispatch?.expiresAt || 0) <= Date.now())))) return;
  const owner = randomUUID();
  const acquired = await mutateState((db) => {
    const now = Date.now();
    if (db.emailDispatch && db.emailDispatch.expiresAt > now) return false;
    for (const job of db.attendanceEmails) {
      if (job.status === 'sending' && (!notice || job.id === notice)) {
        job.status = 'uncertain';
        job.error = 'Delivery was interrupted. Check EmailJS history before retrying';
        job.updatedAt = new Date().toISOString();
      }
    }
    db.emailDispatch = { owner, expiresAt: now + 280_000, nextSendAt: db.emailDispatch?.nextSendAt || 0 };
    return true;
  });
  if (!acquired) return;
  const deadline = Date.now() + 250_000;
  try {
    while (Date.now() < deadline) {
      const next = await mutateState((db) => {
        if (db.emailDispatch?.owner !== owner) return null;
        const job = db.attendanceEmails.find((row) => (!notice || row.id === notice) &&
          row.status === 'pending' && (row.retryAt || 0) <= Date.now() + 2000);
        if (!job) return null;
        const student = db.students.find((row) => row.studentId === job.studentId);
        const record = indexAttendance(db.attendance).get(job.studentId)?.get(job.date);
        if (!student || !record || record.status !== job.attendanceStatus || !isEmailAddress(studentContact(student).email)) {
          job.status = 'cancelled';
          job.updatedAt = new Date().toISOString();
          return { cancelled: true } as const;
        }
        const wait = Math.max(job.retryAt || 0, db.emailDispatch.nextSendAt) - Date.now();
        if (wait > 0) return { wait } as const;
        job.status = 'sending';
        job.attempts++;
        job.recipient = studentContact(student).email;
        job.updatedAt = new Date().toISOString();
        db.emailDispatch.nextSendAt = Date.now() + 1100;
        return { jobId: job.id, parameters: emailParameters(db, student, record) } as const;
      });
      if (!next) break;
      if ('cancelled' in next) continue;
      if ('wait' in next) { await sleep(Math.max(next.wait ?? 1, 1)); continue; }
      let status: AttendanceEmail['status'] = 'uncertain';
      let error = 'The provider response was not received. Check EmailJS history before retrying';
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20_000),
          body: JSON.stringify({
            service_id: process.env.EMAILJS_SERVICE_ID, template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY, template_params: next.parameters,
            ...(process.env.EMAILJS_PRIVATE_KEY && { accessToken: process.env.EMAILJS_PRIVATE_KEY }),
          }),
        });
        if (response.ok) { status = 'sent'; error = ''; }
        else {
          const detail = (await response.text()).slice(0, 1000);
          status = response.status === 429 ? 'pending' : response.status >= 500 ? 'uncertain' : 'failed';
          error = providerError(response.status, detail);
        }
      } catch { /* An interrupted request may have reached the provider, so it requires review. */ }
      await mutateState((db) => {
        const job = db.attendanceEmails.find((row) => row.id === next.jobId);
        if (!job || db.emailDispatch?.owner !== owner) return;
        job.status = status;
        job.error = error || undefined;
        job.updatedAt = new Date().toISOString();
        if (status === 'sent') job.sentAt = job.updatedAt;
        if (status === 'pending') job.retryAt = Date.now() + 60_000;
      });
      if (status === 'pending' || status === 'failed' || status === 'uncertain') break;
    }
  } finally {
    await mutateState((db) => {
      if (db.emailDispatch?.owner === owner) db.emailDispatch.expiresAt = 0;
    });
  }
  const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!notice && Date.now() >= deadline && process.env.VERCEL_ENV === 'production' && process.env.CRON_SECRET && domain) {
    // Continue a large saved register in a fresh invocation. The daily cron also recovers pending work.
    await fetch('https://' + domain + '/api/cron/attendance-emails', {
      headers: { Authorization: 'Bearer ' + process.env.CRON_SECRET }, signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  }
}

export async function scheduleAttendanceEmails(notice?: string) {
  if (!emailConfigured()) return;
  const task = dispatchAttendanceEmails(notice).catch(() => console.error('Attendance email processing interrupted'));
  if (process.env.VERCEL) waitUntil(task);
  else await task;
}

export function attendanceEmailStatus(db: SchoolState) {
  return db.attendanceEmails.slice(-200).reverse().map((job) => ({
    ...job, studentName: db.students.filter((student) => student.studentId === job.studentId)
      .map((student) => [student.firstName, student.lastName].join(' '))[0] || job.studentId,
  }));
}
