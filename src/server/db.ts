import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  displayName: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UserReportItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'lost' | 'found';
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  contact: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'claimed';
  adminNotes?: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  reports: UserReportItem[];
  auditLogs: AuditLogRecord[];
}

const DB_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DB_DIR, 'campus_db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    reports: [],
    auditLogs: [],
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = { users: [], reports: [], auditLogs: [] };
      }
    } catch {
      this.data = { users: [], reports: [], auditLogs: [] };
    }

    this.seedDefaultUsers();
    this.initialized = true;
  }

  private persist() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  private seedDefaultUsers() {
    // Default Admin User
    const existingAdmin = this.data.users.find(
      (u) => u.username === 'admin' || u.role === 'admin'
    );
    if (!existingAdmin) {
      const salt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync('admin123', salt);
      const adminUser: UserRecord = {
        id: 'usr_admin_001',
        username: 'admin',
        email: 'admin@campus-os.edu',
        passwordHash: adminHash,
        role: 'admin',
        displayName: 'Senior Administrator',
        createdAt: new Date().toISOString(),
      };
      this.data.users.push(adminUser);
    }

    // Default Normal User
    const existingUser = this.data.users.find((u) => u.username === 'student_user');
    if (!existingUser) {
      const salt = bcrypt.genSaltSync(10);
      const userHash = bcrypt.hashSync('user123', salt);
      const normalUser: UserRecord = {
        id: 'usr_user_001',
        username: 'student_user',
        email: 'student@campus-os.edu',
        passwordHash: userHash,
        role: 'user',
        displayName: 'Sarah Connor (Student)',
        createdAt: new Date().toISOString(),
      };
      this.data.users.push(normalUser);
    }

    // Seed sample reports if empty
    if (this.data.reports.length === 0) {
      this.data.reports.push({
        id: 'rep_001',
        userId: 'usr_user_001',
        userEmail: 'student@campus-os.edu',
        userName: 'Sarah Connor (Student)',
        type: 'lost',
        title: 'Blue Water Bottle (Hydro Flask)',
        category: 'Accessories',
        description: 'Lost my dark blue hydro flask with school stickers near the main library study area.',
        location: 'Library 2nd Floor',
        date: new Date().toISOString().split('T')[0],
        contact: '+212 600-112233',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      });
      this.data.reports.push({
        id: 'rep_002',
        userId: 'usr_user_001',
        userEmail: 'student@campus-os.edu',
        userName: 'Sarah Connor (Student)',
        type: 'found',
        title: 'Scientific Calculator Casio fx-991',
        category: 'Electronics',
        description: 'Found on desk in Room B-12 after Mathematics exam.',
        location: 'Building B, Room 12',
        date: new Date().toISOString().split('T')[0],
        contact: 'Handed to administration office',
        status: 'reviewed',
        adminNotes: 'Transferred to official lost & found inventory.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      });
    }

    this.persist();
  }

  // User management
  public findUserByUsername(username: string): UserRecord | undefined {
    const clean = username.trim().toLowerCase();
    return this.data.users.find((u) => u.username.toLowerCase() === clean);
  }

  public findUserByEmail(email: string): UserRecord | undefined {
    const clean = email.trim().toLowerCase();
    return this.data.users.find((u) => u.email.toLowerCase() === clean);
  }

  public findUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(params: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    role?: 'admin' | 'user';
  }): UserRecord {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(params.password, salt);

    const newUser: UserRecord = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: params.username.trim().toLowerCase(),
      email: params.email.trim().toLowerCase(),
      passwordHash,
      role: params.role || 'user', // Enforce normal user unless explicit server seed
      displayName: params.displayName.trim() || params.username.trim(),
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  public updateLastLogin(id: string) {
    const user = this.findUserById(id);
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.persist();
    }
  }

  // Reports management
  public getUserReports(userId: string): UserReportItem[] {
    return this.data.reports.filter((r) => r.userId === userId);
  }

  public getAllReports(): UserReportItem[] {
    return [...this.data.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public findReportById(reportId: string): UserReportItem | undefined {
    return this.data.reports.find((r) => r.id === reportId);
  }

  public createReport(report: Omit<UserReportItem, 'id' | 'createdAt'>): UserReportItem {
    const newReport: UserReportItem = {
      ...report,
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    this.data.reports.push(newReport);
    this.persist();
    return newReport;
  }

  public updateReportStatus(
    reportId: string,
    status: UserReportItem['status'],
    adminNotes?: string
  ): UserReportItem | undefined {
    const item = this.findReportById(reportId);
    if (item) {
      item.status = status;
      if (adminNotes !== undefined) {
        item.adminNotes = adminNotes;
      }
      this.persist();
      return item;
    }
    return undefined;
  }

  // Audit logs
  public logAudit(log: Omit<AuditLogRecord, 'id' | 'timestamp'>) {
    const record: AuditLogRecord = {
      ...log,
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.push(record);
    this.persist();
    return record;
  }

  public getAuditLogs(): AuditLogRecord[] {
    return [...this.data.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

export const db = new DatabaseStore();
