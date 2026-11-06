export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  guardianContact?: string;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string; // references Student.studentId
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  time?: string;
  reason?: string;
  notes?: string;
  updatedAt: string;
}

export type ItemCategory = 
  | 'Electronics'
  | 'Clothing'
  | 'Bags'
  | 'Books'
  | 'Accessories'
  | 'School Supplies'
  | 'Other';

export type ItemStatus = 'lost' | 'found' | 'claimed' | 'archived';

export interface LostFoundItem {
  id: string;
  itemName: string;
  category: ItemCategory;
  description: string;
  reportType: 'lost' | 'found';
  dateReported: string; // YYYY-MM-DD
  location: string;
  reporterName: string;
  contactInformation?: string;
  imageUrl?: string;
  status: ItemStatus;
  claimedBy?: string;
  claimedStudentId?: string;
  claimedAt?: string;
  claimNotes?: string;
  createdAt: string;
}

export type ActivityActionType =
  | 'student_created'
  | 'student_edited'
  | 'student_deleted'
  | 'attendance_updated'
  | 'absence_recorded'
  | 'lost_item_reported'
  | 'found_item_reported'
  | 'item_claimed'
  | 'item_archived'
  | 'settings_updated';

export interface ActivityLogItem {
  id: string;
  actionType: ActivityActionType;
  description: string;
  administrator: string;
  timestamp: string; // ISO date string
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  type?: 'absence' | 'lost' | 'found' | 'claimed' | 'system' | 'activity';
}

export interface AdminProfile {
  displayName: string;
  username: string;
  role: string;
  profilePictureUrl?: string; // base64 or url
  email: string;
}

export interface SchoolInfo {
  name: string;
  logoUrl?: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  website: string;
}

export type Language = 'en' | 'fr' | 'ar';
export type ThemeMode = 'light' | 'dark' | 'system';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12h' | '24h';

export interface AppSettings {
  theme: ThemeMode;
  language: Language;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timeZone: string;
  country: string;
  notifications: {
    absence: boolean;
    newLost: boolean;
    newFound: boolean;
    claimed: boolean;
    system: boolean;
    activity: boolean;
  };
  aiAssistant: {
    enabled: boolean;
    model: string;
    strictPrivacyMode: boolean;
    saveHistory: boolean;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isError?: boolean;
  suggestedAction?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface UserReport {
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
