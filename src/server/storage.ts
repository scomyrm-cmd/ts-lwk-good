import { createHash } from 'node:crypto';
import { BlobNotFoundError, BlobPreconditionFailedError, get, head, put } from '@vercel/blob';
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
  mustChangePassword?: boolean;
  profilePictureUrl?: string;
  language?: Language;
  sessionVersion: number;
};

export type StoredItem = LostFoundItem & { source?: 'student_report' };
export type StoredConversation = Conversation & { ownerId?: string; focusedStudentId?: string };
export type Session = { id: string; userId: string; version: number; expiresAt: number };
export type AttendanceEmail = {
  id: string;
  studentId: string;
  date: string;
  attendanceStatus: 'absent' | 'late';
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'uncertain' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  attempts: number;
  recipient?: string;
  error?: string;
  sentAt?: string;
  retryAt?: number;
};

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
  attendanceEmails: AttendanceEmail[];
  emailDispatch?: { owner: string; expiresAt: number; nextSendAt: number };
}

const emptyState = (): SchoolState => ({
  users: [], reports: [], students: [], lostFoundItems: [], attendance: [], activities: [],
  notifications: [], conversations: [], sessions: [], auditEvents: [], attendanceEmails: [],
});

export function storeReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
}

export function privatePath(file: string) {
  const namespace = process.env.CAMPUS_PREVIEW_NAMESPACE;
  if (process.env.VERCEL_ENV === 'production' && namespace) throw new Error('Preview namespace configured for production');
  if (process.env.VERCEL_ENV !== 'preview' && !namespace) return 'campus-os/private/' + file;
  const branch = namespace || process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_URL;
  if (!branch) throw new Error('Preview storage namespace unavailable');
  const key = createHash('sha256').update(branch).digest('hex').slice(0, 24);
  return 'campus-os/previews/' + key + '/private/' + file;
}

export class StorageFailure extends Error {
  constructor(readonly operation: string, readonly reason: string) {
    super('Private storage operation failed');
  }
}

function storageReason(error: unknown) {
  if (!(error instanceof Error)) return 'unknown';
  const http = /^Vercel Blob: Failed to fetch blob: (\d{3}) /.exec(error.message)?.[1];
  if (http) return 'upstream-http-' + http;
  if (/already exists/i.test(error.message)) return 'already-exists';
  if (/rate limit|too many requests/i.test(error.message)) return 'rate-limited';
  if (/suspend|quota|limit reached/i.test(error.message)) return 'quota-or-suspended';
  if (/not authorized|not allowed|forbidden/i.test(error.message)) return 'access-denied';
  if (/ETag mismatch|precondition failed/i.test(error.message)) return 'version-conflict';
  return error.constructor.name;
}

async function readBlob<T>(path: string, initial: () => T) {
  const collection = path.includes('/limits/') ? 'rate-limit' : 'state';
  let blob: Awaited<ReturnType<typeof get>>;
  try {
    blob = await get(path, { access: 'private', useCache: false });
  } catch (error) {
    throw new StorageFailure(collection + '-read', storageReason(error));
  }
  if (!blob) return { value: initial(), exists: false };
  if (blob.statusCode !== 200 || !blob.stream) throw new StorageFailure(collection + '-read', 'missing-content');
  const value = await new Response(blob.stream).json() as T;
  return { value, exists: true };
}

async function writeVersion(path: string) {
  try {
    const metadata = await head(path);
    if (!metadata.etag) throw new StorageFailure('metadata-read', 'missing-version');
    return metadata.etag;
  } catch (error) {
    if (error instanceof BlobNotFoundError) return undefined;
    if (error instanceof StorageFailure) throw error;
    throw new StorageFailure('metadata-read', storageReason(error));
  }
}

function isWriteConflict(error: unknown, creating: boolean) {
  if (!(error instanceof Error)) return false;
  const status = 'statusCode' in error ? error.statusCode : undefined;
  return error instanceof BlobPreconditionFailedError || status === 412 ||
    (creating && (status === 409 || /already exists/i.test(error.message)));
}

export async function updateBlob<T, R>(
  file: string,
  initial: () => T,
  apply: (value: T) => { result: R; skipWrite?: boolean },
): Promise<R> {
  const path = privatePath(file);
  for (let attempt = 0; attempt < 6; attempt++) {
    // The write API uses the Blob metadata ETag. A private origin read can report a different HTTP ETag.
    // Capture the metadata version before reading the body so a newer write cannot be overwritten.
    const etag = await writeVersion(path);
    const { value, exists } = await readBlob(path, initial);
    if (Boolean(etag) !== exists) continue;
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
      if (!isWriteConflict(error, !etag)) {
        throw new StorageFailure(file.startsWith('limits/') ? 'rate-limit-write' : 'state-write', storageReason(error));
      }
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1) + Math.random() * 30));
    }
  }
  throw new StorageFailure(file.startsWith('limits/') ? 'rate-limit-write' : 'state-write', 'version-conflict');
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
