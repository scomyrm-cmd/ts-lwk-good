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
  students?: any[];
  studentsLastSaved?: string;
  lostFoundItems?: any[];
}

function getDbFile(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'campus_db.json');
  }
  const defaultDir = path.resolve(process.cwd(), '.data');
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    return path.join(defaultDir, 'campus_db.json');
  } catch {
    return path.join('/tmp', 'campus_db.json');
  }
}

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    reports: [],
    auditLogs: [],
    students: [],
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dbFile = getDbFile();
      const dir = path.dirname(dbFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(dbFile)) {
        const raw = fs.readFileSync(dbFile, 'utf-8');
        this.data = JSON.parse(raw);
        if (!Array.isArray(this.data.students)) {
          this.data.students = [];
        }
      } else {
        this.data = { users: [], reports: [], auditLogs: [], students: [] };
      }
    } catch {
      this.data = { users: [], reports: [], auditLogs: [], students: [] };
    }

    this.seedDefaultUsers();
    this.initialized = true;
  }

  private persist() {
    try {
      const dbFile = getDbFile();
      const dir = path.dirname(dbFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbFile, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  private seedDefaultUsers() {
    // 1. Remove old default 'admin' account if present
    this.data.users = this.data.users.filter((u) => u.username !== 'admin');

    // 2. Seed or update primary administrator: islamnourbouya / islamoss1980
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('islamoss1980', salt);

    const existingAdmin = this.data.users.find(
      (u) => u.username === 'islamnourbouya'
    );

    if (!existingAdmin) {
      const adminUser: UserRecord = {
        id: 'usr_admin_001',
        username: 'islamnourbouya',
        email: 'islamnourbouya@campus-os.edu',
        passwordHash: adminHash,
        role: 'admin',
        displayName: 'Islam Nour Bouya',
        createdAt: new Date().toISOString(),
      };
      this.data.users.unshift(adminUser);
    } else {
      existingAdmin.passwordHash = adminHash;
      existingAdmin.role = 'admin';
      existingAdmin.displayName = 'Islam Nour Bouya';
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

  public getAllUsers(): Array<Omit<UserRecord, 'passwordHash'>> {
    return this.data.users
      .map(({ passwordHash, ...safe }) => safe)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public deleteUser(id: string, currentAdminId?: string): { success: boolean; error?: string } {
    const userIndex = this.data.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return { success: false, error: 'User account not found.' };
    }

    const targetUser = this.data.users[userIndex];
    if (currentAdminId && targetUser.id === currentAdminId) {
      return { success: false, error: 'You cannot delete your own active administrator account.' };
    }

    // Do not allow deleting the last remaining admin
    if (targetUser.role === 'admin') {
      const adminCount = this.data.users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, error: 'Cannot delete the only remaining administrator account.' };
      }
    }

    this.data.users.splice(userIndex, 1);
    this.persist();
    return { success: true };
  }

  public updateUser(
    id: string,
    updates: {
      displayName?: string;
      email?: string;
      role?: 'admin' | 'user';
      password?: string;
    }
  ): { success: boolean; error?: string; user?: Omit<UserRecord, 'passwordHash'> } {
    const user = this.findUserById(id);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    if (updates.email) {
      const cleanEmail = updates.email.trim().toLowerCase();
      const existing = this.data.users.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.id !== id
      );
      if (existing) {
        return { success: false, error: 'Email address already in use by another account.' };
      }
      user.email = cleanEmail;
    }

    if (updates.displayName !== undefined) {
      user.displayName = updates.displayName.trim();
    }

    if (updates.role) {
      user.role = updates.role;
    }

    if (updates.password && updates.password.trim().length >= 6) {
      const salt = bcrypt.genSaltSync(10);
      user.passwordHash = bcrypt.hashSync(updates.password, salt);
    }

    this.persist();
    const { passwordHash, ...safe } = user;
    return { success: true, user: safe };
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
    this.data.reports.unshift(newReport);

    // Automatically sync student report to lost & found items so the admin and dashboard see it immediately
    if (!Array.isArray(this.data.lostFoundItems)) {
      this.data.lostFoundItems = [];
    }

    const linkedItem = {
      id: newReport.id,
      itemName: newReport.title,
      category: newReport.category,
      type: newReport.type,
      location: newReport.location,
      dateReported: newReport.date,
      reportedBy: `${newReport.userName} (${newReport.userEmail})`,
      description: newReport.description,
      status: (newReport.type === 'lost' ? 'lost' : 'found') as 'lost' | 'found',
      contactInfo: newReport.contact,
      createdAt: newReport.createdAt,
      source: 'student_report',
    };
    this.data.lostFoundItems.unshift(linkedItem);

    this.persist();
    return newReport;
  }

  // Lost & Found items persistence
  public getLostFoundItems(): any[] {
    return Array.isArray(this.data.lostFoundItems) ? this.data.lostFoundItems : [];
  }

  public saveLostFoundItems(items: any[]): { success: boolean; count: number } {
    this.data.lostFoundItems = Array.isArray(items) ? items : [];
    this.persist();
    return { success: true, count: this.data.lostFoundItems.length };
  }

  public addLostFoundItem(item: any): any {
    if (!Array.isArray(this.data.lostFoundItems)) {
      this.data.lostFoundItems = [];
    }
    const newItem = {
      ...item,
      id: item.id || 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: item.createdAt || new Date().toISOString(),
    };
    this.data.lostFoundItems.unshift(newItem);
    this.persist();
    return newItem;
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
    return [...this.data.auditLogs].reverse();
  }

  // Students server persistence (Admin-only access)
  public getStudents(): any[] {
    return Array.isArray(this.data.students) ? this.data.students : [];
  }

  public getStudentsLastSaved(): string | undefined {
    return this.data.studentsLastSaved;
  }

  public saveStudents(
    students: any[],
    adminId: string,
    adminUsername: string
  ): { success: boolean; count: number; savedAt: string } {
    const savedAt = new Date().toISOString();
    this.data.students = Array.isArray(students) ? students : [];
    this.data.studentsLastSaved = savedAt;

    this.logAudit({
      adminId,
      adminUsername,
      action: 'save_students_data',
      details: `Saved ${this.data.students.length} student records securely into server database`,
    });

    this.persist();
    return { success: true, count: this.data.students.length, savedAt };
  }
}

export const db = new DatabaseStore();
