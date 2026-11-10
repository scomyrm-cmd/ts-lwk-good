import { createHash } from 'node:crypto';
import { get, put } from '@vercel/blob';
import type { ActivityLogItem, AdminProfile, AppSettings, AttendanceRecord, Conversation, Language, LostFoundItem, NotificationItem, SchoolInfo, Student, UserReport } from '../types/index.js';

export type Account = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
  disabledAt?: string;
  language?: Language;
  sessionVersion: number;
};

export type StoredItem = LostFoundItem & { source?: 'student_report' };
export type StoredConversation = Conversation & { ownerId?: string; focusedStudentId?: string };
export type Session = { id: string; userId: string; version: number; expiresAt: number };

export interface SchoolState {
  users: Account[];
  reports: UserReport[];
  students: Student[];
  studentsLastSaved?: string;
  lostFoundItems: StoredItem[];
  attendance: AttendanceRecord[];
  activities: ActivityLogItem[];
  notifications: NotificationItem[];
  conversations: StoredConversation[];
  adminProfile?: AdminProfile;
  schoolInfo?: SchoolInfo;
  settings?: AppSettings;
  sessions: Session[];
  adminSetupFingerprint?: string;
  usedAdminSetupCodes?: string[];
  auditEvents: Array<{ actorId: string; at: string; type: string }>;
}

const emptyState = (): SchoolState => ({
  users: [], reports: [], students: [], lostFoundItems: [], attendance: [], activities: [],
  notifications: [], conversations: [], sessions: [], auditEvents: [],
});

export function storeReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
}

export function privatePath(file: string) {
  if (process.env.VERCEL_ENV !== 'preview') return 'campus-os/private/' + file;
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_URL;
  if (!branch) throw new Error('Preview storage namespace unavailable');
  const key = createHash('sha256').update(branch).digest('hex').slice(0, 24);
  return 'campus-os/previews/' + key + '/private/' + file;
}

async function readBlob<T>(path: string, initial: () => T) {
  const blob = await get(path, { access: 'private', useCache: false });
  if (!blob) return { value: initial(), etag: undefined };
  if (blob.statusCode !== 200 || !blob.stream || !blob.blob.etag) {
    throw new Error('Private storage returned an invalid response');
  }
  const value = await new Response(blob.stream).json() as T;
  return { value, etag: blob.blob.etag };
}

function isWriteConflict(error: unknown, creating: boolean) {
  if (!(error instanceof Error)) return false;
  const status = 'statusCode' in error ? error.statusCode : undefined;
  return error.name === 'BlobPreconditionFailedError' || status === 412 ||
    (creating && (status === 409 || /already exists/i.test(error.message)));
}

export async function updateBlob<T, R>(
  file: string,
  initial: () => T,
  apply: (value: T) => { result: R; skipWrite?: boolean },
): Promise<R> {
  const path = privatePath(file);
  for (let attempt = 0; attempt < 6; attempt++) {
    const { value, etag } = await readBlob(path, initial);
    const { result, skipWrite } = apply(value);
    if (skipWrite) return result;
    try {
      await put(path, JSON.stringify(value), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: Boolean(etag),
        ...(etag && { ifMatch: etag }),
      });
      return result;
    } catch (error) {
      if (!isWriteConflict(error, !etag)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1) + Math.random() * 30));
    }
  }
  throw new Error('Private storage write conflict');
}

function compatibleState(value: SchoolState): SchoolState {
  if (!Array.isArray(value.users) || !Array.isArray(value.reports)) throw new Error('Invalid school state');
  return { ...emptyState(), ...value };
}

export async function readState() {
  const { value } = await readBlob(privatePath('state.json'), emptyState);
  return compatibleState(value);
}

export function mutateState<T>(apply: (state: SchoolState) => T) {
  return updateBlob('state.json', emptyState, (value) => {
    const state = compatibleState(value);
    const result = apply(state);
    Object.assign(value, state);
    return { result };
  });
}

export function addAuditEvent(state: SchoolState, actorId: string, type: string) {
  state.auditEvents.push({ actorId, type, at: new Date().toISOString() });
}
