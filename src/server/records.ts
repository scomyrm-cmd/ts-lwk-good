import type { AppSettings, AttendanceRecord, Student, UserReport } from '../types/index.js';
import { choice, digest, field, HttpError, object } from './security.js';
import type { SchoolState, StoredItem } from './storage.js';

export const categories = ['Electronics', 'Clothing', 'Bags', 'Books', 'Accessories', 'School Supplies', 'Other'] as const;
export const attendanceStatuses = ['present', 'absent', 'late', 'excused'] as const;
const itemStatuses = ['lost', 'found', 'claimed', 'archived'] as const;
const editableCollections = ['students', 'attendance', 'lostFoundItems', 'activities', 'notifications'] as const;
export const editableKeys = [...editableCollections, 'adminProfile', 'schoolInfo', 'settings'] as const;
type EditableKey = typeof editableKeys[number];

export function isoDate(value: unknown) {
  const date = field(value, 10, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, 'Enter a valid date');
  const parsed = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) throw new HttpError(400, 'Enter a valid date');
  return date;
}

function timestamp(value: unknown) {
  const time = field(value, 45, true);
  if (!Number.isFinite(Date.parse(time))) throw new HttpError(400, 'Invalid timestamp');
  return time;
}

function boolean(value: unknown) {
  if (typeof value !== 'boolean') throw new HttpError(400, 'Invalid boolean field');
  return value;
}

function httpsUrl(value: unknown) {
  const text = field(value, 2000);
  if (!text) return '';
  try {
    const url = new URL(text);
    if (url.protocol === 'https:' && !url.username && !url.password) return text;
  } catch {}
  throw new HttpError(400, 'Use a valid HTTPS address');
}

function image(value: unknown) {
  const text = field(value, 450_000);
  if (!text || /^data:image\/(?:png|jpeg|webp);base64,[a-z\d+/]+={0,2}$/i.test(text)) return text;
  return httpsUrl(text);
}

function student(value: Record<string, unknown>): Student {
  return {
    id: field(value.id, 120, true), studentId: field(value.studentId, 120, true),
    firstName: field(value.firstName, 120, true), lastName: field(value.lastName, 120, true),
    className: field(value.className, 120, true),
    gender: value.gender ? choice(value.gender, ['Male', 'Female', 'Other'] as const) : undefined,
    dateOfBirth: value.dateOfBirth ? isoDate(value.dateOfBirth) : undefined,
    guardianContact: field(value.guardianContact, 220), notes: field(value.notes, 4000), createdAt: timestamp(value.createdAt),
  };
}

function attendanceRecord(value: Record<string, unknown>): AttendanceRecord {
  return {
    id: field(value.id, 120, true), studentId: field(value.studentId, 120, true),
    date: isoDate(value.date), status: choice(value.status, attendanceStatuses),
    time: field(value.time, 40), reason: field(value.reason, 1000), notes: field(value.notes, 4000),
    updatedAt: timestamp(value.updatedAt),
  };
}

function lostFoundItem(value: Record<string, unknown>, previous?: StoredItem): StoredItem {
  return {
    id: field(value.id, 120, true), itemName: field(value.itemName, 150, true),
    category: choice(value.category, categories), description: field(value.description, 2500),
    reportType: choice(value.reportType, ['lost', 'found'] as const), dateReported: isoDate(value.dateReported),
    location: field(value.location, 200, true), reporterName: field(value.reporterName, 300, true),
    contactInformation: field(value.contactInformation, 220), imageUrl: image(value.imageUrl),
    status: choice(value.status, itemStatuses), claimedBy: field(value.claimedBy, 180),
    claimedStudentId: field(value.claimedStudentId, 120), claimNotes: field(value.claimNotes, 2500),
    claimedAt: value.claimedAt ? isoDate(value.claimedAt) : undefined,
    createdAt: timestamp(value.createdAt), source: previous?.source,
  };
}

function activity(value: Record<string, unknown>) {
  return {
    id: field(value.id, 120, true),
    actionType: choice(value.actionType, ['student_created', 'student_edited', 'student_deleted',
      'attendance_updated', 'absence_recorded', 'lost_item_reported', 'found_item_reported',
      'item_claimed', 'item_archived', 'settings_updated'] as const),
    description: field(value.description, 2000, true),
    administrator: field(value.administrator, 120, true), timestamp: timestamp(value.timestamp),
  };
}

function notification(value: Record<string, unknown>) {
  return {
    id: field(value.id, 120, true), title: field(value.title, 300, true),
    description: field(value.description, 2000), createdAt: timestamp(value.createdAt),
    read: boolean(value.read), type: value.type == null ? undefined :
      choice(value.type, ['absence', 'lost', 'found', 'claimed', 'system', 'activity'] as const),
  };
}

function validatedList<T extends { id: string }>(
  value: unknown,
  previous: T[],
  validate: (row: Record<string, unknown>, old?: T) => T,
  max = 5000,
) {
  if (!Array.isArray(value) || value.length > Math.max(max, previous.length)) {
    throw new HttpError(400, 'Invalid collection or too many records');
  }
  const old = new Map(previous.map((entry) => [entry.id, entry]));
  const seen = new Set<string>();
  return value.map((entry) => {
    const row = object(entry);
    const id = field(row.id, 120, true);
    if (seen.has(id)) throw new HttpError(400, 'Record identifiers must be unique');
    seen.add(id);
    const before = old.get(id);
    return before && JSON.stringify(before) === JSON.stringify(row) ? before : validate(row, before);
  });
}

export function schoolDate(timeZone = 'Africa/Casablanca') {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone };
  try { return new Intl.DateTimeFormat('sv-SE', options).format(new Date()); }
  catch { return new Date().toISOString().slice(0, 10); }
}

function readSettings(value: Record<string, unknown>, previous?: AppSettings): AppSettings {
  const notifications = object(value.notifications);
  const ai = object(value.aiAssistant);
  const timeZone = field(value.timeZone, 100, true);
  try { new Intl.DateTimeFormat('en', { timeZone }); }
  catch { throw new HttpError(400, 'Invalid time zone'); }
  return {
    theme: choice(value.theme, ['light', 'dark', 'system'] as const),
    language: choice(value.language, ['en', 'fr', 'ar'] as const),
    dateFormat: choice(value.dateFormat, ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const),
    timeFormat: choice(value.timeFormat, ['12h', '24h'] as const),
    timeZone,
    country: field(value.country, 100, true),
    notifications: {
      absence: boolean(notifications.absence), newLost: boolean(notifications.newLost),
      newFound: boolean(notifications.newFound), claimed: boolean(notifications.claimed),
      system: boolean(notifications.system), activity: boolean(notifications.activity),
    },
    aiAssistant: {
      enabled: boolean(ai.enabled), saveHistory: boolean(ai.saveHistory),
      strictPrivacyMode: true,
      autoSpeak: ai.autoSpeak == null ? undefined : boolean(ai.autoSpeak),
      model: previous?.aiAssistant?.model || 'gemini-2.5-flash',
    },
  };
}

export function applyUpdates(db: SchoolState, updates: Record<string, unknown>, versions: Record<string, unknown>) {
  const keys = Object.keys(updates);
  if (!keys.length || keys.some((key) => !editableKeys.includes(key as EditableKey))) {
    throw new HttpError(400, 'Invalid state field');
  }

  for (const key of keys as EditableKey[]) {
    if (versions[key] !== versionOf(db[key])) throw new HttpError(409, 'These records changed on the server. Refresh before saving again.');
    const value = updates[key];
    switch (key) {
      case 'students': {
        const students = validatedList(value, db.students, student);
        if (new Set(students.map(({ studentId }) => studentId)).size !== students.length) {
          throw new HttpError(400, 'Student numbers must be unique');
        }
        db.students = students;
        break;
      }
      case 'attendance':
        db.attendance = validatedList(value, db.attendance, attendanceRecord, 50_000);
        break;
      case 'lostFoundItems':
        db.lostFoundItems = validatedList(value, db.lostFoundItems, lostFoundItem);
        break;
      case 'activities':
        db.activities = validatedList(value, db.activities, activity, 500);
        break;
      case 'notifications':
        db.notifications = validatedList(value, db.notifications, notification, 500);
        break;
      case 'adminProfile': {
        const profile = object(value);
        db.adminProfile = {
          displayName: field(profile.displayName, 120, true), profilePictureUrl: image(profile.profilePictureUrl),
          username: db.adminProfile?.username || '', email: db.adminProfile?.email || '',
          role: db.adminProfile?.role || 'Administrator',
        };
        break;
      }
      case 'schoolInfo': {
        const school = object(value);
        db.schoolInfo = {
          name: field(school.name, 180, true), logoUrl: image(school.logoUrl), address: field(school.address, 300),
          city: field(school.city, 120), country: field(school.country, 120), email: field(school.email, 160),
          phone: field(school.phone, 80), website: httpsUrl(school.website),
        };
        break;
      }
      case 'settings':
        db.settings = readSettings(object(value), db.settings);
        break;
    }
  }

  return Object.fromEntries(keys.map((key) => [key, versionOf(db[key as EditableKey])]));
}

export function versionOf(value: unknown) {
  return digest(JSON.stringify(value ?? null));
}

export function getAdminState(db: SchoolState) {
  return {
    state: { ...Object.fromEntries(editableKeys.map((key) => [key, db[key]])), studentsLastSaved: db.studentsLastSaved },
    versions: Object.fromEntries(editableKeys.map((key) => [key, versionOf(db[key])])),
  };
}

export function publicCatalog(db: SchoolState) {
  const pending = new Set(db.reports.filter((report) => report.status === 'pending').map((report) => report.id));
  return db.lostFoundItems.filter((item) =>
    (item.status === 'lost' || item.status === 'found') && !pending.has(item.id)
  ).map(({ id, itemName, category, description, reportType, dateReported, location, status, createdAt }) =>
    ({ id, itemName, category, description, reportType, dateReported, location, status, createdAt }));
}

export function publishReport(db: SchoolState, report: UserReport) {
  if (db.lostFoundItems.some((item) => item.id === report.id)) return;
  db.lostFoundItems.unshift({
    id: report.id, itemName: report.title, category: categories.find((value) => value === report.category) || 'Other',
    reportType: report.type, status: report.type, location: report.location, dateReported: report.date,
    reporterName: report.userName, contactInformation: report.contact, description: report.description,
    createdAt: report.createdAt, source: 'student_report',
  });
}
