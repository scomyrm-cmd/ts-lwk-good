import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Student,
  AttendanceRecord,
  AttendanceStatus,
  LostFoundItem,
  ActivityLogItem,
  NotificationItem,
  AdminProfile,
  SchoolInfo,
  AppSettings,
  ChatMessage,
  Conversation,
  Language,
  AuthUser,
  UserReport,
  ItemCategory,
} from '../types';
import { translations, Translations } from '../i18n/translations';
import { schoolDate } from '../utils/dates';

interface AppContextType {
  isVerifyingAuth: boolean;
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  adminDataStatus: 'loading' | 'ready' | 'unavailable';
  setUpAdministrator: (code: string, password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (u: string, p: string, requireAdmin?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (u: string, email: string, p: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // User Reports & Admin Incident Management
  userReports: UserReport[];
  fetchUserReports: () => Promise<void>;
  fetchAdminReports: () => Promise<void>;
  updateAdminReportStatus: (reportId: string, status: 'pending' | 'reviewed' | 'resolved', notes?: string, publish?: boolean) => Promise<{ success: boolean; error?: string }>;
  submitUserReport: (data: {
    type: 'lost' | 'found';
    title: string;
    category: string;
    description: string;
    location: string;
    date: string;
    contact?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  fetchLostFoundFromServer: (signal?: AbortSignal) => Promise<void>;

  // Excel Export
  exportStudentsToExcel: (filterClass?: string, filterStatus?: string) => Promise<{ success: boolean; error?: string }>;

  // Server Student Persistence (Admin-Only)
  isSavingStudents: boolean;
  lastSavedStudentsAt: string | null;
  saveStudentsToServer: () => Promise<{ success: boolean; count?: number; error?: string }>;

  // Admin User Management
  users: AuthUser[];
  fetchAdminUsers: () => Promise<void>;
  createAdminUser: (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    role: 'admin' | 'user';
  }) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  deleteAdminUser: (userId: string) => Promise<{ success: boolean; error?: string }>;

  activeTab: string;
  setActiveTab: (tab: string) => void;
  settingsSubTab: string;
  setSettingsSubTab: (subTab: string) => void;

  currentDate: string;
  setCurrentDate: (date: string) => void;

  students: Student[];
  attendance: AttendanceRecord[];
  lostFoundItems: LostFoundItem[];
  activities: ActivityLogItem[];
  notifications: NotificationItem[];
  conversations: Conversation[];
  adminProfile: AdminProfile;
  schoolInfo: SchoolInfo;
  settings: AppSettings;
  t: Translations;

  // Student methods
  addStudent: (data: Omit<Student, 'id' | 'createdAt'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // Attendance methods
  markAttendance: (
    studentId: string,
    status: AttendanceStatus,
    reason?: string,
    notes?: string,
    date?: string
  ) => void;
  deleteAttendanceRecord: (id: string) => void;

  // Lost & Found methods
  addLostFoundItem: (data: Omit<LostFoundItem, 'id' | 'createdAt' | 'status'> & { status?: LostFoundItem['status'] }) => LostFoundItem;
  updateLostFoundItem: (id: string, data: Partial<LostFoundItem>) => void;
  claimItem: (id: string, claimedBy: string, claimNotes?: string, studentId?: string) => void;
  archiveItem: (id: string) => void;
  deleteLostFoundItem: (id: string) => void;

  // Activity & Notifications
  logActivity: (actionType: ActivityLogItem['actionType'], description: string) => void;
  clearActivityHistory: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Profile & Settings
  updateAdminProfile: (profile: Partial<AdminProfile>) => void;
  updateSchoolInfo: (info: Partial<SchoolInfo>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Chat Conversations & AI Navigation
  saveConversation: (conv: Conversation) => void;
  askCampusAI: (id: string, prompt: string, history: ChatMessage[]) => Promise<{ text: string; source: string }>;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  pendingAIPrompt: string | null;
  setPendingAIPrompt: (prompt: string | null) => void;
  openAIChat: (initialPrompt?: string) => void;

  // Demo management
  seedDemoData: () => void;
  clearAllSchoolData: () => void;

  // UI state
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const defaultAdminProfile: AdminProfile = {
  displayName: 'Administrator',
  username: '',
  role: 'Senior Administrator',
  profilePictureUrl: '',
  email: '',
};

const defaultSchoolInfo: SchoolInfo = {
  name: 'Al-Manar International Academy',
  address: 'Avenue des Nations Unies, Hay Riad',
  city: 'Rabat',
  country: 'Morocco',
  email: 'administration@almanar-academy.ma',
  phone: '+212 537 778 899',
  website: 'https://almanar-academy.ma',
  logoUrl: '',
};

const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  timeZone: 'Africa/Casablanca',
  country: 'Morocco',
  notifications: {
    absence: true,
    newLost: true,
    newFound: true,
    claimed: true,
    system: true,
    activity: true,
  },
  aiAssistant: {
    enabled: true,
    model: 'gemini-2.5-flash',
    strictPrivacyMode: true,
    saveHistory: true,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getTodayStr = () => schoolDate(defaultSettings.timeZone);

  // STRICT SERVER-AUTHORITATIVE AUTHENTICATION
  // Never default to true on cold-load or link copying; session MUST be verified with the server!
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const sessionUser = useRef<AuthUser | null>(null);
  const [adminDataStatus, setAdminDataStatus] = useState<AppContextType['adminDataStatus']>('loading');

  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<string>('admin-profile');
  const [currentDate, setCurrentDate] = useState<string>(getTodayStr());

  // HttpOnly cookie session is always verified by the server.
  // Never trust or resurrect an offline browser identity.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch('/api/auth/me', {credentials:'include',cache:'no-store'});
        const data = await response.json();
        if(mounted && response.ok && data.authenticated && data.user) {
          startSession(data.user);
        } else if(mounted) {
          setCurrentUser(null);setIsAuthenticated(false);
        }
      }catch(e){if(mounted){setCurrentUser(null);setIsAuthenticated(false);}}
      finally{if(mounted)setIsVerifyingAuth(false);}
    })();
    return ()=>{mounted=false;};
  },[]);

  const [isSavingStudents, setIsSavingStudents] = useState<boolean>(false);
  const [lastSavedStudentsAt, setLastSavedStudentsAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin' || currentUser.mustChangePassword) return;
    fetchAdminUsers();
    fetchAdminReports();
    // Poll for reports from other devices, so new student submissions appear automatically.
    const timer = setInterval(()=>{fetchAdminReports();fetchLostFoundFromServer();},15000);
    return ()=>clearInterval(timer);
  }, [isAuthenticated,currentUser?.role,currentUser?.id,currentUser?.mustChangePassword]);


  // Private records are loaded only after the server verifies the session.
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(defaultAdminProfile);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(defaultSchoolInfo);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const hydrated = useRef(false);
  const persisted = useRef<Record<string, string>>({});
  const versions = useRef<Record<string, string>>({});
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const preferenceChain = useRef<Promise<void>>(Promise.resolve());
  const latestState = useRef<Record<string, unknown>>({});
  latestState.current = { students, attendance, lostFoundItems, activities, notifications, adminProfile, schoolInfo, settings };

  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingAIPrompt, setPendingAIPrompt] = useState<string | null>(null);

  const openAIChat = (initialPrompt?: string) => {
    if (initialPrompt) {
      setPendingAIPrompt(initialPrompt);
    }
    setActiveTab('campus-ai');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin' || currentUser.mustChangePassword) return;
    const request = new AbortController();
    setAdminDataStatus('loading');
    hydrated.current = false;
    void (async () => {
      try {
        const response = await fetch('/api/admin/state', { credentials: 'include', cache: 'no-store', signal: request.signal });
        const data = await response.json();
        if (!response.ok || !data.success || !data.state || !data.versions) throw new Error('School data could not be loaded');
        if (request.signal.aborted) return;
        const value = data.state;
        const nextSettings = {
          ...defaultSettings, ...value.settings,
          notifications: { ...defaultSettings.notifications, ...value.settings?.notifications },
          aiAssistant: { ...defaultSettings.aiAssistant, ...value.settings?.aiAssistant, strictPrivacyMode: true },
        };
        const next = {
          students: value.students ?? [], attendance: value.attendance ?? [], lostFoundItems: value.lostFoundItems ?? [],
          activities: value.activities ?? [], notifications: value.notifications ?? [],
          adminProfile: { ...defaultAdminProfile, ...value.adminProfile }, schoolInfo: { ...defaultSchoolInfo, ...value.schoolInfo },
          settings: nextSettings,
        };
        persisted.current = Object.fromEntries(Object.entries(next).map(([key, record]) => [key, JSON.stringify(record)]));
        versions.current = data.versions;
        setStudents(next.students);
        setAttendance(next.attendance);
        setLostFoundItems(next.lostFoundItems);
        setActivities(next.activities);
        setNotifications(next.notifications);
        setConversations(data.conversations ?? []);
        setAdminProfile(next.adminProfile);
        setSchoolInfo(next.schoolInfo);
        setSettings(next.settings);
        setLastSavedStudentsAt(value.studentsLastSaved ?? null);
        hydrated.current = true;
        setAdminDataStatus('ready');
      } catch {
        if (!request.signal.aborted) setAdminDataStatus('unavailable');
      }
    })();
    return () => {
      request.abort();
      hydrated.current = false;
    };
  }, [isAuthenticated, currentUser?.id, currentUser?.role, currentUser?.mustChangePassword]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings.language]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && preference.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    syncTheme();
    if (settings.theme !== 'system') return;
    preference.addEventListener('change', syncTheme);
    return () => preference.removeEventListener('change', syncTheme);
  }, [settings.theme]);

  function flushServerChanges() {
    const account = sessionUser.current;
    if (account?.role !== 'admin' || !hydrated.current) return Promise.resolve();
    const task = saveChain.current.then(async () => {
      if (sessionUser.current?.id !== account.id || !hydrated.current) return;
      const changes = Object.fromEntries(Object.entries(latestState.current)
        .filter(([key, value]) => JSON.stringify(value) !== persisted.current[key]));
      if (!Object.keys(changes).length) return;
      const base = Object.fromEntries(Object.keys(changes).map((key) => [key, versions.current[key]]));
      const response = await fetch('/api/admin/state', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: changes, versions: base }),
      });
      const result = await parseApi(response);
      if (!response.ok || !result.success) throw new Error(result.error || 'Server save failed');
      if (sessionUser.current?.id !== account.id) return;
      Object.assign(versions.current, result.versions);
      for (const [key, value] of Object.entries(changes)) persisted.current[key] = JSON.stringify(value);
    });
    saveChain.current = task.catch(() => {});
    return task;
  }

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin' || adminDataStatus !== 'ready') return;
    const timer = setTimeout(() => {
      void flushServerChanges().catch((error: Error) => showToast('Unsaved changes: ' + error.message));
    }, 650);
    return () => clearTimeout(timer);
  }, [students, attendance, lostFoundItems, activities, notifications, adminProfile, schoolInfo, settings,
    isAuthenticated, currentUser?.id, currentUser?.role, adminDataStatus]);

  const t = translations[settings.language] || translations.en;

  const parseApi = async (response:Response) => {
    const raw=await response.text();
    try{return raw?JSON.parse(raw):{error:'Empty response from server'};}
    catch{return {error:'Server did not return valid JSON. Please try again.'};}
  };

  function startSession(user: AuthUser) {
    hydrated.current = false;
    persisted.current = {};
    versions.current = {};
    sessionUser.current = user;
    setAdminProfile({ ...defaultAdminProfile, displayName: user.displayName, username: user.username, email: user.email, role: user.role });
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAdminDataStatus('loading');
    setActiveTab(user.role === 'admin' ? 'dashboard' : 'lostfound-user');
    if (user.role === 'user' && user.language) setSettings((previous) => ({ ...previous, language: user.language! }));
  }

  async function authRequest(path: string, body: Record<string, string | boolean>, establishSession: boolean) {
    try {
      const response = await fetch(path, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await parseApi(response);
      if (!response.ok || !result.success || (establishSession && !result.user)) {
        return { success: false, error: result.error || 'Authentication request failed' };
      }
      if (establishSession) {
        startSession(result.user);
        window.history.replaceState(null, '', result.user.role === 'admin' ? '/admin' : '/');
      } else if (result.user && sessionUser.current?.id === result.user.id) {
        sessionUser.current = result.user;
        setCurrentUser(result.user);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Could not connect to the server. Please try again.' };
    }
  }

  const login = (username: string, password: string, requireAdmin = false) =>
    authRequest('/api/auth/login', { username: username.trim(), password, requireAdmin }, true);

  const register = (username: string, email: string, password: string, displayName?: string) =>
    authRequest('/api/auth/register', { username: username.trim(), email: email.trim(), password, displayName: displayName?.trim() || username.trim() }, true);

  const setUpAdministrator = (code: string, password: string) =>
    authRequest('/api/auth/admin-setup', { code: code.trim(), password }, true);

  const changePassword = (currentPassword: string, password: string) =>
    authRequest('/api/auth/password', { currentPassword, password }, false);

  const logout = async () => {
    try {
      const saved = await flushServerChanges().then(() => true, () => false);
      await preferenceChain.current;
      const result = await authRequest('/api/auth/logout', {}, false);
      if (!result.success) throw new Error(result.error);
      window.history.replaceState(null, '', sessionUser.current?.role === 'admin' ? '/admin/login' : '/');
      sessionUser.current = null;
      hydrated.current = false;
      persisted.current = {};
      versions.current = {};
      setCurrentUser(null);
      setIsAuthenticated(false);
      setActiveTab('dashboard');
      setStudents([]);
      setAttendance([]);
      setLostFoundItems([]);
      setActivities([]);
      setNotifications([]);
      setConversations([]);
      setUserReports([]);
      setUsers([]);
      setPendingAIPrompt(null);
      setAdminProfile(defaultAdminProfile);
      setSchoolInfo(defaultSchoolInfo);
      setSettings((previous) => ({ ...defaultSettings, language: previous.language }));
      if (!saved) showToast('Signed out. Some pending edits could not be saved.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Sign-out failed. Please try again.');
    }
  };

  const fetchUserReports = async () => {
    try {
      const res = await fetch('/api/user/reports', {
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (Array.isArray(data.reports)) {
          setUserReports(data.reports);
        }
      }
    } catch (e) { console.error('Could not refresh server reports:',e); }
  };

  const fetchAdminReports = async () => {
    try {
      const res = await fetch('/api/admin/reports', {
        headers: {
        },
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (Array.isArray(data.reports)) {
          setUserReports(data.reports);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin reports:', err);
    }
  };

  const updateAdminReportStatus = async (
    reportId: string,
    status: 'pending' | 'reviewed' | 'resolved',
    adminNotes?: string,
    publish = false,
  ) => {
    try {
      if (publish) await flushServerChanges();
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, status, adminNotes, publish }),
      });
      const result = await parseApi(res);
      if (!res.ok || !result.success || !result.report) throw new Error(result.error || 'Report update failed');
      setUserReports((previous) => previous.map((report) => report.id === reportId ? result.report : report));
      if (publish) await fetchLostFoundFromServer();
      showToast(publish ? 'Report added to the official catalog.' : 'Report status saved.');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Report update failed';
      showToast(message);
      return { success: false, error: message };
    }
  };

  const fetchLostFoundFromServer = async (signal?: AbortSignal) => {
    const account = sessionUser.current;
    if (!account) return;
    const admin = account.role === 'admin';
    const base = versions.current.lostFoundItems;
    try {
      const response = await fetch(admin ? '/api/admin/lost-found' : '/api/user/lost-found', {
        credentials: 'include', cache: 'no-store', signal,
      });
      if (!response.ok || signal?.aborted) return;
      const data = await response.json();
      if (signal?.aborted || sessionUser.current?.id !== account.id || !data.success || !Array.isArray(data.items)) return;
      if (admin) {
        if (!hydrated.current || versions.current.lostFoundItems !== base ||
          JSON.stringify(latestState.current.lostFoundItems) !== persisted.current.lostFoundItems) return;
        versions.current.lostFoundItems = data.version;
        persisted.current.lostFoundItems = JSON.stringify(data.items);
      }
      setLostFoundItems(data.items);
    } catch {
      if (!signal?.aborted) showToast('The lost-and-found catalog could not be refreshed.');
    }
  };

  const submitUserReport = async (data: {
    type: 'lost' | 'found';
    title: string;
    category: string;
    description: string;
    location: string;
    date: string;
    contact?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/user/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const text = await res.text();
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { error: text || 'Failed to submit report' };
      }

      if (!res.ok) {
        return { success: false, error: result.error || 'Failed to submit report' };
      }

      if (result.report) {
        setUserReports((prev) => [result.report, ...prev]);

        showToast('Report saved. The administration can review it.');
        return { success: true };
      }
      return { success: false, error: 'Failed to submit report' };
    } catch (e:any) {
      return {success:false,error:'Report was not saved to server. Please retry.'};
    }
  };

  const exportStudentsToExcel = async (filterClass?: string, filterStatus?: string) => {
    try {
      await flushServerChanges();
      const response = await fetch('/api/admin/students/export-excel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterClass, filterStatus, date: currentDate, confirmed: true }),
      });
      if (!response.ok) {
        const error = await parseApi(response);
        throw new Error(error.error || 'Export failed');
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `CampusOS_Student_Registry_${currentDate}.xlsx`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const count = response.headers.get('X-Campus-Export-Count');
      logActivity('settings_updated', 'Exported the student registry to Excel');
      showToast(count ? `Exported ${count} students to Excel.` : 'Student registry exported to Excel.');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Export failed' };
    }
  };

  const saveStudentsToServer = async () => {
    setIsSavingStudents(true);
    try {
      await flushServerChanges();
      const value = latestState.current.students;
      const res = await fetch('/api/admin/students/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: value, version: versions.current.students }),
      });
      const data = await parseApi(res);
      if (!res.ok || !data.success) throw new Error(data.error || 'Student records could not be saved');
      versions.current.students = data.version;
      persisted.current.students = JSON.stringify(value);
      setLastSavedStudentsAt(data.savedAt);
      showToast(t.studentsSavedSuccess);
      return { success: true, count: data.count };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Student records could not be saved';
      showToast(message);
      return { success: false, error: message };
    } finally {
      setIsSavingStudents(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
        },
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    }
  };

  const createAdminUser = async (userData: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    role: 'admin' | 'user';
  }): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || `Server error (${res.status})` };
      }

      if (!res.ok) {
        return { success: false, error: data.error || `Failed to create user (Status: ${res.status})` };
      }

      if (data.success && data.user) {
        setUsers((prev) => [data.user, ...prev.filter((u) => u.id !== data.user.id)]);
        showToast(`User account '${data.user.username}' created successfully!`);
        logActivity('settings_updated', `Created user account '${data.user.username}' with role '${data.user.role}'`);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Failed to create user account' };
    } catch (err:any) {
      return {success:false,error:'Server did not create the account. '+(err?.message||'')};
    }
  };

  const deleteAdminUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete user account' };
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast('User account deleted successfully.');
      logActivity('settings_updated', `Deleted user account ID '${userId}'`);
      return { success: true };
    } catch (err:any) {
      return {success:false,error:'Server did not delete the account. '+(err?.message||'')};
    }
  };

  const logActivity = (actionType: ActivityLogItem['actionType'], description: string) => {
    const item: ActivityLogItem = {
      id: 'act_' + Date.now() + Math.random().toString(36).substring(2, 6),
      actionType,
      description,
      administrator: adminProfile.displayName,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [item, ...prev].slice(0, 100));
  };

  const addNotification = (title: string, description: string, type: NotificationItem['type'] = 'system') => {
    const item: NotificationItem = {
      id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6),
      title,
      description,
      read: false,
      createdAt: new Date().toISOString(),
      type,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 50));
  };

  const addStudent = (data: Omit<Student, 'id' | 'createdAt'>): Student => {
    const newStudent: Student = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setStudents((prev) => [newStudent, ...prev]);
    logActivity('student_created', `Registered student ${data.firstName} ${data.lastName} (${data.studentId}) in ${data.className}`);
    showToast(`Student ${data.firstName} ${data.lastName} registered successfully.`);
    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...data };
          logActivity('student_edited', `Updated student profile for ${updated.firstName} ${updated.lastName}`);
          return updated;
        }
        return s;
      })
    );
    showToast('Student information updated.');
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    if (!target) return;
    setStudents((prev) => prev.filter((s) => s.id !== id));
    // Remove any attendance records for this student
    setAttendance((prev) => prev.filter((a) => a.studentId !== target.studentId));
    logActivity('student_deleted', `Deleted student ${target.firstName} ${target.lastName} (${target.studentId})`);
    showToast(`Student ${target.firstName} ${target.lastName} removed.`);
  };

  const markAttendance = (
    studentId: string,
    status: AttendanceStatus,
    reason?: string,
    notes?: string,
    date?: string
  ) => {
    const targetDate = date || currentDate;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAttendance((prev) => {
      // Prevent duplicates: Check if record exists for this student on targetDate
      const existingIndex = prev.findIndex((r) => r.studentId === studentId && r.date === targetDate);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status,
          time: nowTime,
          reason: reason !== undefined ? reason : updated[existingIndex].reason,
          notes: notes !== undefined ? notes : updated[existingIndex].notes,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      } else {
        const newRecord: AttendanceRecord = {
          id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
          studentId,
          date: targetDate,
          status,
          time: nowTime,
          reason,
          notes,
          updatedAt: new Date().toISOString(),
        };
        return [newRecord, ...prev];
      }
    });

    const student = students.find((s) => s.studentId === studentId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : studentId;

    if (status === 'absent' || status === 'excused') {
      logActivity('absence_recorded', `Recorded ${status} status for ${studentName} on ${targetDate}`);
      if (settings.notifications.absence) {
        addNotification(`Absence Recorded: ${studentName}`, `Marked as ${status} on ${targetDate}. Reason: ${reason || 'Not specified'}`, 'absence');
      }
    } else {
      logActivity('attendance_updated', `Updated attendance for ${studentName} to ${status}`);
    }
  };

  const deleteAttendanceRecord = (id: string) => {
    setAttendance((prev) => prev.filter((r) => r.id !== id));
    logActivity('attendance_updated', 'Removed attendance record');
    showToast('Attendance record removed.');
  };

  const addLostFoundItem = (data: Omit<LostFoundItem, 'id' | 'createdAt' | 'status'> & { status?: LostFoundItem['status'] }) => {
    const newItem: LostFoundItem = {
      ...data,
      id: crypto.randomUUID(),
      status: data.status || (data.reportType === 'lost' ? 'lost' : 'found'),
      createdAt: new Date().toISOString(),
    };
    setLostFoundItems((prev) => [newItem, ...prev]);

    if (newItem.reportType === 'lost') {
      logActivity('lost_item_reported', `Reported lost item: ${newItem.itemName} at ${newItem.location}`);
      if (settings.notifications.newLost) {
        addNotification(`Lost Item Reported: ${newItem.itemName}`, `Category: ${newItem.category} · Location: ${newItem.location}`, 'lost');
      }
    } else {
      logActivity('found_item_reported', `Reported found item: ${newItem.itemName} at ${newItem.location}`);
      if (settings.notifications.newFound) {
        addNotification(`Found Item: ${newItem.itemName}`, `Turned in at ${newItem.location}`, 'found');
      }
    }

    showToast(`${newItem.itemName} report submitted.`);
    return newItem;
  };

  const updateLostFoundItem = (id: string, data: Partial<LostFoundItem>) => {
    setLostFoundItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          return { ...i, ...data };
        }
        return i;
      })
    );
    showToast('Item updated successfully.');
  };

  const claimItem = (id: string, claimedBy: string, claimNotes?: string, studentId?: string) => {
    const item = lostFoundItems.find((i) => i.id === id);
    if (!item) return;

    const claimedAt = new Date().toISOString().split('T')[0];
    setLostFoundItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            status: 'claimed',
            claimedBy,
            claimedStudentId: studentId,
            claimedAt,
            claimNotes,
          };
        }
        return i;
      })
    );

    logActivity('item_claimed', `Item "${item.itemName}" claimed by ${claimedBy}`);
    if (settings.notifications.claimed) {
      addNotification(`Item Claimed: ${item.itemName}`, `Collected by ${claimedBy} on ${claimedAt}`, 'claimed');
    }
    showToast(`Item "${item.itemName}" successfully marked as claimed.`);
  };

  const archiveItem = (id: string) => {
    const item = lostFoundItems.find((i) => i.id === id);
    if (!item) return;
    setLostFoundItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'archived' } : i))
    );
    logActivity('item_archived', `Archived item: ${item.itemName}`);
    showToast(`Item "${item.itemName}" archived.`);
  };

  const deleteLostFoundItem = (id: string) => {
    const item = lostFoundItems.find((i) => i.id === id);
    if (!item) return;
    setLostFoundItems((prev) => prev.filter((i) => i.id !== id));
    showToast(`Item "${item.itemName}" deleted.`);
  };

  const clearActivityHistory = () => {
    setActivities([]);
    showToast('Activity log cleared.');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  };

  const updateAdminProfile = (profile: Partial<AdminProfile>) => {
    setAdminProfile((prev) => ({ ...prev, ...profile }));
    logActivity('settings_updated', 'Updated administrator profile details');
    showToast('Administrator profile saved.');
  };

  const updateSchoolInfo = (info: Partial<SchoolInfo>) => {
    setSchoolInfo((prev) => ({ ...prev, ...info }));
    logActivity('settings_updated', 'Updated school institutional information');
    showToast('School information updated.');
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((previous) => ({ ...previous, ...newSettings }));
    const language = newSettings.language;
    const account = sessionUser.current;
    if (language && account?.role === 'user') {
      preferenceChain.current = preferenceChain.current.then(async () => {
        if (sessionUser.current?.id !== account.id) return;
        const response = await fetch('/api/user/preferences', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language }),
        });
        if (!response.ok) throw new Error('Language preference could not be saved');
      }).catch(() => showToast('Language preference could not be saved.'));
    }
  };

  const askCampusAI = async (id: string, prompt: string, history: ChatMessage[]) => {
    await flushServerChanges();
    const response = await fetch('/api/campus-ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: id, prompt, language: settings.language,
        history: history.filter(({ sender, isError }) => sender !== 'system' && !isError)
          .slice(-10).map(({ sender, content }) => ({ sender, content: content.slice(0, 6000) })),
      }),
    });
    const data = await parseApi(response);
    if (!response.ok || typeof data.text !== 'string' || !data.text) throw new Error(data.error || 'Campus AI is unavailable');
    return { text: data.text as string, source: data.source as string };
  };

  const saveConversation = (conv: Conversation) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conv.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = conv;
        return updated;
      }
      return [conv, ...prev];
    });
  };

  async function removeConversations(id?: string) {
    try {
      const response = await fetch('/api/admin/conversations', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
      });
      const data = await parseApi(response);
      if (!response.ok || !data.success) throw new Error(data.error || 'Conversation history could not be changed');
      setConversations((previous) => id ? previous.filter((conversation) => conversation.id !== id) : []);
      if (!id) showToast('AI conversation history cleared.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Conversation history could not be changed.');
    }
  }

  const deleteConversation = (id: string) => { void removeConversations(id); };
  const clearAllConversations = () => { void removeConversations(); };

  // Seed realistic demo data when requested by user in settings
  const seedDemoData = () => {
    const demoStudents: Student[] = [
      { id: 's1', studentId: 'STU-1001', firstName: 'Youssef', lastName: 'Benali', className: 'Grade 10-A', gender: 'Male', dateOfBirth: '2009-03-12', guardianContact: '+212 661 112 233', createdAt: '2026-09-01' },
      { id: 's2', studentId: 'STU-1002', firstName: 'Sara', lastName: 'El Idrissi', className: 'Grade 10-A', gender: 'Female', dateOfBirth: '2009-07-22', guardianContact: '+212 662 334 455', createdAt: '2026-09-01' },
      { id: 's3', studentId: 'STU-1003', firstName: 'Mehdi', lastName: 'Alami', className: 'Grade 10-A', gender: 'Male', dateOfBirth: '2009-01-15', guardianContact: '+212 663 556 677', createdAt: '2026-09-01' },
      { id: 's4', studentId: 'STU-1004', firstName: 'Imane', lastName: 'Chraibi', className: 'Grade 10-A', gender: 'Female', dateOfBirth: '2009-11-04', guardianContact: '+212 664 778 899', createdAt: '2026-09-01' },
      { id: 's5', studentId: 'STU-1005', firstName: 'Omar', lastName: 'Berrada', className: 'Grade 10-B', gender: 'Male', dateOfBirth: '2009-05-18', guardianContact: '+212 665 990 011', createdAt: '2026-09-01' },
      { id: 's6', studentId: 'STU-1006', firstName: 'Salma', lastName: 'Tahiri', className: 'Grade 10-B', gender: 'Female', dateOfBirth: '2009-08-30', guardianContact: '+212 666 223 344', createdAt: '2026-09-01' },
      { id: 's7', studentId: 'STU-1007', firstName: 'Hamza', lastName: 'Kabbaj', className: 'Grade 10-B', gender: 'Male', dateOfBirth: '2009-04-09', guardianContact: '+212 667 445 566', createdAt: '2026-09-01' },
      { id: 's8', studentId: 'STU-1008', firstName: 'Nour', lastName: 'Fassi', className: 'Grade 10-B', gender: 'Female', dateOfBirth: '2009-12-14', guardianContact: '+212 668 667 788', createdAt: '2026-09-01' },
      { id: 's9', studentId: 'STU-1101', firstName: 'Amine', lastName: 'Zouiten', className: 'Grade 11-A', gender: 'Male', dateOfBirth: '2008-02-10', guardianContact: '+212 669 889 900', createdAt: '2026-09-01' },
      { id: 's10', studentId: 'STU-1102', firstName: 'Lina', lastName: 'Ghannam', className: 'Grade 11-A', gender: 'Female', dateOfBirth: '2008-06-25', guardianContact: '+212 670 112 233', createdAt: '2026-09-01' },
      { id: 's11', studentId: 'STU-1103', firstName: 'Reda', lastName: 'Tazi', className: 'Grade 11-A', gender: 'Male', dateOfBirth: '2008-09-17', guardianContact: '+212 671 334 455', createdAt: '2026-09-01' },
      { id: 's12', studentId: 'STU-1104', firstName: 'Hiba', lastName: 'Filali', className: 'Grade 11-A', gender: 'Female', dateOfBirth: '2008-10-03', guardianContact: '+212 672 556 677', createdAt: '2026-09-01' },
      { id: 's13', studentId: 'STU-1105', firstName: 'Walid', lastName: 'Bennani', className: 'Grade 11-B', gender: 'Male', dateOfBirth: '2008-03-29', guardianContact: '+212 673 778 899', createdAt: '2026-09-01' },
      { id: 's14', studentId: 'STU-1106', firstName: 'Kenza', lastName: 'Bouzid', className: 'Grade 11-B', gender: 'Female', dateOfBirth: '2008-07-11', guardianContact: '+212 674 990 011', createdAt: '2026-09-01' },
      { id: 's15', studentId: 'STU-1201', firstName: 'Anas', lastName: 'Mansouri', className: 'Grade 12-A', gender: 'Male', dateOfBirth: '2007-04-14', guardianContact: '+212 675 223 344', createdAt: '2026-09-01' },
      { id: 's16', studentId: 'STU-1202', firstName: 'Rania', lastName: 'Slaoui', className: 'Grade 12-A', gender: 'Female', dateOfBirth: '2007-08-19', guardianContact: '+212 676 445 566', createdAt: '2026-09-01' },
      { id: 's17', studentId: 'STU-1203', firstName: 'Saad', lastName: 'Chakib', className: 'Grade 12-A', gender: 'Male', dateOfBirth: '2007-11-02', guardianContact: '+212 677 667 788', createdAt: '2026-09-01' },
      { id: 's18', studentId: 'STU-1204', firstName: 'Zineb', lastName: 'Mejjati', className: 'Grade 12-B', gender: 'Female', dateOfBirth: '2007-01-28', guardianContact: '+212 678 889 900', createdAt: '2026-09-01' },
      { id: 's19', studentId: 'STU-1205', firstName: 'Taha', lastName: 'Rachidi', className: 'Grade 12-B', gender: 'Male', dateOfBirth: '2007-05-06', guardianContact: '+212 679 112 233', createdAt: '2026-09-01' },
      { id: 's20', studentId: 'STU-1206', firstName: 'Malak', lastName: 'Zerouali', className: 'Grade 12-B', gender: 'Female', dateOfBirth: '2007-10-15', guardianContact: '+212 680 334 455', createdAt: '2026-09-01' },
    ];

    const today = getTodayStr();
    const demoAttendance: AttendanceRecord[] = [
      { id: 'a1', studentId: 'STU-1001', date: today, status: 'present', time: '08:00', updatedAt: '2026-11-03' },
      { id: 'a2', studentId: 'STU-1002', date: today, status: 'present', time: '08:02', updatedAt: '2026-11-03' },
      { id: 'a3', studentId: 'STU-1003', date: today, status: 'absent', reason: 'Flu symptoms', notes: 'Parent notified school office', time: '08:15', updatedAt: '2026-11-03' },
      { id: 'a4', studentId: 'STU-1004', date: today, status: 'late', reason: 'Public transport delay', time: '08:25', updatedAt: '2026-11-03' },
      { id: 'a5', studentId: 'STU-1005', date: today, status: 'present', time: '08:00', updatedAt: '2026-11-03' },
      { id: 'a6', studentId: 'STU-1006', date: today, status: 'excused', reason: 'Official dentist appointment', notes: 'Doctor certificate provided', time: '08:05', updatedAt: '2026-11-03' },
      { id: 'a7', studentId: 'STU-1007', date: today, status: 'present', time: '07:55', updatedAt: '2026-11-03' },
      { id: 'a8', studentId: 'STU-1008', date: today, status: 'present', time: '07:58', updatedAt: '2026-11-03' },
      { id: 'a9', studentId: 'STU-1101', date: today, status: 'present', time: '08:00', updatedAt: '2026-11-03' },
      { id: 'a10', studentId: 'STU-1102', date: today, status: 'absent', reason: 'Family emergency', time: '08:30', updatedAt: '2026-11-03' },
      { id: 'a11', studentId: 'STU-1103', date: today, status: 'present', time: '08:01', updatedAt: '2026-11-03' },
      { id: 'a12', studentId: 'STU-1104', date: today, status: 'present', time: '08:04', updatedAt: '2026-11-03' },
      { id: 'a13', studentId: 'STU-1105', date: today, status: 'late', reason: 'Heavy traffic', time: '08:18', updatedAt: '2026-11-03' },
      { id: 'a14', studentId: 'STU-1106', date: today, status: 'present', time: '07:50', updatedAt: '2026-11-03' },
      { id: 'a15', studentId: 'STU-1201', date: today, status: 'present', time: '07:59', updatedAt: '2026-11-03' },
      { id: 'a16', studentId: 'STU-1202', date: today, status: 'present', time: '08:00', updatedAt: '2026-11-03' },
      { id: 'a17', studentId: 'STU-1203', date: today, status: 'present', time: '08:00', updatedAt: '2026-11-03' },
      { id: 'a18', studentId: 'STU-1204', date: today, status: 'present', time: '08:03', updatedAt: '2026-11-03' },
      { id: 'a19', studentId: 'STU-1205', date: today, status: 'absent', reason: 'Sports competition', time: '08:10', updatedAt: '2026-11-03' },
      { id: 'a20', studentId: 'STU-1206', date: today, status: 'present', time: '08:00', updatedAt: '2026-11-03' },
    ];

    const demoLostFound: LostFoundItem[] = [
      { id: 'lf1', itemName: 'Scientific Calculator Casio fx-991', category: 'Electronics', description: 'Silver and black casing with blue protective lid, initials S.E.', reportType: 'found', dateReported: today, location: 'Science Lab 3', reporterName: 'Lab Assistant', status: 'found', createdAt: '2026-11-03' },
      { id: 'lf2', itemName: 'Navy Blue School Blazer', category: 'Clothing', description: 'School uniform blazer with emblem, size M, name tag Youssef inside pocket', reportType: 'lost', dateReported: today, location: 'Sports Gymnasium', reporterName: 'Student Parent', status: 'lost', createdAt: '2026-11-03' },
      { id: 'lf3', itemName: 'Black Leather Pencil Case', category: 'School Supplies', description: 'Contains geometry set, colored fineliners and memory stick', reportType: 'found', dateReported: today, location: 'Library Reading Room', reporterName: 'Librarian Mme. Bennani', status: 'found', createdAt: '2026-11-03' },
      { id: 'lf4', itemName: 'Gray Ergonomic Backpack', category: 'Bags', description: 'Waterproof fabric with orange zippers and water bottle attached', reportType: 'found', dateReported: '2026-11-02', location: 'Cafeteria courtyard bench', reporterName: 'Campus Security', status: 'claimed', claimedBy: 'Sara El Idrissi', claimedStudentId: 'STU-1002', claimedAt: '2026-11-02', claimNotes: 'Verified with locker key inside', createdAt: '2026-11-02' },
      { id: 'lf5', itemName: 'Advanced Mathematics Textbook', category: 'Books', description: 'Grade 11 Moroccan Curriculum Analysis and Algebra textbook', reportType: 'found', dateReported: '2026-11-01', location: 'Classroom 204', reporterName: 'Mathematics Teacher', status: 'found', createdAt: '2026-11-01' },
      { id: 'lf6', itemName: 'Wireless Earbuds in White Case', category: 'Electronics', description: 'White magnetic charging case with small green silicone strap', reportType: 'lost', dateReported: '2026-11-01', location: 'Computer Lab 1', reporterName: 'Student', status: 'lost', createdAt: '2026-11-01' },
      { id: 'lf7', itemName: 'Student ID Card & Bus Pass', category: 'Accessories', description: 'Rabat Tramway card & School ID badge in clear sleeve', reportType: 'found', dateReported: '2026-10-31', location: 'Main Entrance Gate', reporterName: 'Campus Reception', status: 'claimed', claimedBy: 'Reda Tazi', claimedStudentId: 'STU-1103', claimedAt: '2026-10-31', claimNotes: 'Matched identity card photo', createdAt: '2026-10-31' },
    ];

    const demoActivities: ActivityLogItem[] = [
      { id: 'act_1', actionType: 'attendance_updated', description: 'Submitted daily morning attendance register for 20 students', administrator: adminProfile.displayName, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { id: 'act_2', actionType: 'found_item_reported', description: 'Registered found Casio calculator in Science Lab 3', administrator: adminProfile.displayName, timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: 'act_3', actionType: 'absence_recorded', description: 'Recorded excused absence for Salma Tahiri (Dentist appointment)', administrator: adminProfile.displayName, timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
      { id: 'act_4', actionType: 'item_claimed', description: 'Released Gray Ergonomic Backpack to Sara El Idrissi', administrator: adminProfile.displayName, timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    ];

    const demoNotifications: NotificationItem[] = [
      { id: 'not_1', title: 'Absence Alert', description: '3 students recorded absent today. Excuses requested from guardians.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), type: 'absence' },
      { id: 'not_2', title: 'New Found Item Logged', description: 'Scientific Calculator Casio fx-991 added to inventory.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(), type: 'found' },
      { id: 'not_3', title: 'Item Claim Verified', description: 'Backpack claimed and collected by Sara El Idrissi.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(), type: 'claimed' },
    ];

    setStudents(demoStudents);
    setAttendance(demoAttendance);
    setLostFoundItems(demoLostFound);
    setActivities(demoActivities);
    setNotifications(demoNotifications);
    showToast('Loaded 20 demo students and school records.');
  };

  const clearAllSchoolData = () => {
    setStudents([]);
    setAttendance([]);
    setLostFoundItems([]);
    setActivities([]);
    setNotifications([]);
    setConversations([]);
    showToast('All school database records cleared to clean state.');
  };

  return (
    <AppContext.Provider
      value={{
        isVerifyingAuth,
        isAuthenticated,
        currentUser,
        adminDataStatus,
        setUpAdministrator,
        changePassword,
        login,
        register,
        logout,
        userReports,
        fetchUserReports,
        fetchAdminReports,
        updateAdminReportStatus,
        fetchLostFoundFromServer,
        submitUserReport,
        exportStudentsToExcel,
        isSavingStudents,
        lastSavedStudentsAt,
        saveStudentsToServer,
        users,
        fetchAdminUsers,
        createAdminUser,
        deleteAdminUser,
        activeTab,
        setActiveTab,
        settingsSubTab,
        setSettingsSubTab,
        currentDate,
        setCurrentDate,
        students,
        attendance,
        lostFoundItems,
        activities,
        notifications,
        conversations,
        adminProfile,
        schoolInfo,
        settings,
        t,
        addStudent,
        updateStudent,
        deleteStudent,
        markAttendance,
        deleteAttendanceRecord,
        addLostFoundItem,
        updateLostFoundItem,
        claimItem,
        archiveItem,
        deleteLostFoundItem,
        logActivity,
        clearActivityHistory,
        markNotificationRead,
        markAllNotificationsRead,
        updateAdminProfile,
        updateSchoolInfo,
        updateSettings,
        saveConversation,
        askCampusAI,
        deleteConversation,
        clearAllConversations,
        pendingAIPrompt,
        setPendingAIPrompt,
        openAIChat,
        seedDemoData,
        clearAllSchoolData,
        globalSearchOpen,
        setGlobalSearchOpen,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
