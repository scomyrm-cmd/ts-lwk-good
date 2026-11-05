import React, { createContext, useContext, useState, useEffect } from 'react';
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
  Conversation,
  Language,
} from '../types';
import { translations, Translations } from '../i18n/translations';

interface AppContextType {
  isAuthenticated: boolean;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;

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
  displayName: 'Islam Nour Bouya',
  username: 'admin',
  role: 'Senior Administrator',
  profilePictureUrl: '',
  email: 'admin@campus-os.edu',
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
    model: 'gemini-3.8-flash',
    strictPrivacyMode: false,
    saveHistory: true,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('campus_os_auth') === 'true';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<string>('admin-profile');
  const [currentDate, setCurrentDate] = useState<string>(getTodayStr());

  // Data states starting CLEAN by default as requested
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('campus_os_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('campus_os_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>(() => {
    const saved = localStorage.getItem('campus_os_lost_found');
    return saved ? JSON.parse(saved) : [];
  });

  const [activities, setActivities] = useState<ActivityLogItem[]>(() => {
    const saved = localStorage.getItem('campus_os_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('campus_os_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('campus_os_conversations');
    return saved ? JSON.parse(saved) : [];
  });

  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => {
    const saved = localStorage.getItem('campus_os_admin_profile');
    return saved ? JSON.parse(saved) : defaultAdminProfile;
  });

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem('campus_os_school_info');
    return saved ? JSON.parse(saved) : defaultSchoolInfo;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('campus_os_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

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

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('campus_os_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('campus_os_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('campus_os_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('campus_os_lost_found', JSON.stringify(lostFoundItems));
  }, [lostFoundItems]);

  useEffect(() => {
    localStorage.setItem('campus_os_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('campus_os_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('campus_os_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('campus_os_admin_profile', JSON.stringify(adminProfile));
  }, [adminProfile]);

  useEffect(() => {
    localStorage.setItem('campus_os_school_info', JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    localStorage.setItem('campus_os_settings', JSON.stringify(settings));
    // Apply HTML dir and lang
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';

    // Apply dark mode class to html element
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const t = translations[settings.language] || translations.en;

  const login = async (u: string, p: string): Promise<boolean> => {
    // Demo authentication check
    await new Promise((res) => setTimeout(res, 500));
    if (u === 'admin' && p === 'admin') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('campus_os_auth');
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
      id: 'stu_' + Date.now(),
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
      id: 'lf_' + Date.now(),
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
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Preferences updated.');
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

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const clearAllConversations = () => {
    setConversations([]);
    showToast('AI conversation history cleared.');
  };

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
        isAuthenticated,
        login,
        logout,
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
