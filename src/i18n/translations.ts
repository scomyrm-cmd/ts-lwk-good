import { Language } from '../types';

export interface Translations {
  // Common
  appName: string;
  appSubtitle: string;
  workspaceLabel: string;
  workspaceTitle: string;
  workspaceDescription: string;
  schoolOperations: string;
  workspaceTools: string;
  openNavigation: string;
  closeNavigation: string;
  accountMenu: string;
  verifyingSession: string;
  signInDescription: string;
  adminSignInDescription: string;
  registerDescription: string;
  loginIdentity: string;
  emailAddress: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  passwordMismatch: string;
  passwordMinLength: string;
  registrationError: string;
  notMarked: string;
  reportsAwaitingReview: string;
  viewActivity: string;
  portalCatalogDescription: string;
  portalReportDescription: string;
  portalReportsDescription: string;
  noMatchingItems: string;
  adjustFilters: string;
  noPersonalReports: string;
  portalAIDescription: string;
  openAssistant: string;
  totalAccounts: string;
  officialCatalog: string;
  studentReports: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  view: string;
  search: string;
  filter: string;
  all: string;
  exportCsv: string;
  confirm: string;
  loading: string;
  actions: string;
  status: string;
  date: string;
  time: string;
  close: string;
  notes: string;
  success: string;
  error: string;
  required: string;
  back: string;
  next: string;
  today: string;
  yesterday: string;

  // Portals & Roles
  adminPortal: string;
  normalUserPortal: string;
  adminLoginBtn: string;
  userLoginBtn: string;
  registerBtn: string;
  registerTitle: string;
  alreadyHaveAccount: string;
  needAccount: string;
  adminAccessOnly: string;
  exportExcel: string;
  exportingExcel: string;
  exportConfirmTitle: string;
  exportConfirmDesc: string;
  myReports: string;
  submitReport: string;
  lostFoundCatalog: string;
  accessDenied: string;
  adminRoleRequired: string;
  backToPortal: string;
  saveToServer: string;
  savingToServer: string;
  studentsSavedSuccess: string;
  serverSavedBadge: string;

  // Navigation
  navDashboard: string;
  navStudents: string;
  navAttendance: string;
  navLostFound: string;
  navActivity: string;
  navSettings: string;
  navCampusAI: string;
  navUsers: string;
  logout: string;

  // User Management
  usersTitle: string;
  usersSubtitle: string;
  addUser: string;
  userRoleAdmin: string;
  userRoleUser: string;
  confirmDeleteUser: string;
  generatePassword: string;

  // AI Speech & Voice
  aiVoiceSpeak: string;
  aiVoiceListening: string;
  aiVoiceStop: string;
  aiAutoSpeak: string;

  // Top bar
  globalSearchPlaceholder: string;
  notificationsTitle: string;
  noNotifications: string;
  markAllRead: string;
  editProfile: string;

  // Dashboard
  dashboardTitle: string;
  dashboardSubtitle: string;
  totalStudents: string;
  presentToday: string;
  absentToday: string;
  lostItemsPending: string;
  attendanceOverview: string;
  recentActivity: string;
  quickActions: string;
  registerStudentAction: string;
  recordAbsenceAction: string;
  reportFoundAction: string;
  viewAttendanceAction: string;

  // Students
  studentsTitle: string;
  studentsSubtitle: string;
  addStudent: string;
  studentId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  className: string;
  gender: string;
  dateOfBirth: string;
  guardianContact: string;
  attendanceStatus: string;
  viewProfile: string;
  editStudent: string;
  deleteStudent: string;
  confirmDeleteStudent: string;
  noStudentsTitle: string;
  noStudentsDesc: string;
  registerFirstStudent: string;
  filterClass: string;

  // Attendance
  attendanceTitle: string;
  attendanceSubtitle: string;
  selectDate: string;
  present: string;
  absent: string;
  late: string;
  excused: string;
  reason: string;
  absenceReason: string;
  absenceType: string;
  markPresent: string;
  markAbsent: string;
  markLate: string;
  markExcused: string;
  tabDaily: string;
  tabHistory: string;
  tabReports: string;
  noAttendanceTitle: string;
  noAttendanceDesc: string;
  attendanceRate: string;
  totalAbsences: string;
  topAbsentClasses: string;
  attendanceTrends: string;

  // Lost & Found
  lostFoundTitle: string;
  lostFoundSubtitle: string;
  totalReported: string;
  lostItems: string;
  foundItems: string;
  claimedItems: string;
  reportLostItem: string;
  reportFoundItem: string;
  itemName: string;
  category: string;
  location: string;
  reportedBy: string;
  description: string;
  markAsClaimed: string;
  archiveItem: string;
  claimedBy: string;
  claimedDate: string;
  collectedBy: string;
  claimNotes: string;
  confirmClaim: string;
  noItemsTitle: string;
  noItemsDesc: string;
  uploadPhoto: string;

  // Activity Log
  activityTitle: string;
  activitySubtitle: string;
  action: string;
  admin: string;
  timestamp: string;
  noActivityTitle: string;
  noActivityDesc: string;
  clearActivity: string;

  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  tabGeneral: string;
  tabAppearance: string;
  tabLanguageRegion: string;
  tabNotifications: string;
  tabAdminProfile: string;
  tabSchoolInfo: string;
  tabSecurity: string;
  tabAISettings: string;

  // Appearance
  themeMode: string;
  lightTheme: string;
  darkTheme: string;
  systemTheme: string;

  // Language & Region
  preferredLanguage: string;
  dateFormat: string;
  timeFormat: string;
  timeZone: string;
  regionCountry: string;

  // Admin Profile
  adminProfileTitle: string;
  displayName: string;
  username: string;
  adminRole: string;
  profilePicture: string;
  changePhoto: string;
  removePhoto: string;
  saveChanges: string;
  cancelChanges: string;

  // School Info
  schoolName: string;
  schoolAddress: string;
  schoolCity: string;
  schoolCountry: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolWebsite: string;
  schoolLogo: string;

  // AI Assistant
  aiConversations: string;
  aiNoConversations: string;
  aiSuggestions: string;
  aiExpand: string;
  aiClaimPrompt: string;
  aiWelcomeTitle: string;
  aiWelcomeSubtitle: string;
  aiInputPlaceholder: string;
  aiSend: string;
  aiNewChat: string;
  aiClearChat: string;
  aiGenerateReport: string;
  aiSuggestedPrompt1: string;
  aiSuggestedPrompt2: string;
  aiSuggestedPrompt3: string;
  aiSuggestedPrompt4: string;
  aiSuggestedPrompt5: string;
  aiSuggestedPrompt6: string;
  aiCopy: string;
  aiCopied: string;
  aiPrivacyNotice: string;
  aiStatusConnected: string;
  aiStatusDemo: string;

  // Login
  loginTitle: string;
  loginButton: string;
  loginError: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Campus OS',
    appSubtitle: 'School Administration Portal',
    workspaceLabel: "School workspace",
    workspaceTitle: "School administration",
    workspaceDescription: "Manage student records, attendance, and lost property.",
    schoolOperations: "School operations",
    workspaceTools: "Workspace tools",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    accountMenu: "Account menu",
    verifyingSession: "Checking your session…",
    signInDescription: "Use your student or parent account to continue.",
    adminSignInDescription: "Use your school administrator account to continue.",
    registerDescription: "Create an account to browse lost property and submit reports.",
    loginIdentity: "Username or email",
    emailAddress: "Email address",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm password",
    showPasswordLabel: "Show password",
    hidePasswordLabel: "Hide password",
    passwordMismatch: "Passwords do not match.",
    passwordMinLength: "Use at least 10 characters.",
    registrationError: "Could not create your account. Check your details and try again.",
    notMarked: "Unmarked",
    reportsAwaitingReview: "Student reports to review",
    viewActivity: "View activity log",
    portalCatalogDescription: "Browse items reported lost or found at school.",
    portalReportDescription: "Tell the school team what you lost or found.",
    portalReportsDescription: "Check the status of reports you sent to the school.",
    noMatchingItems: "No matching items",
    adjustFilters: "Try another search or change the filters.",
    noPersonalReports: "No reports yet",
    portalAIDescription: "Ask about school information and lost property.",
    openAssistant: "Open assistant",
    totalAccounts: "Total accounts",
    officialCatalog: "School catalog",
    studentReports: "Student reports",
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search...',
    filter: 'Filter',
    all: 'All',
    exportCsv: 'Export CSV',
    confirm: 'Confirm',
    loading: 'Loading...',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    close: 'Close',
    notes: 'Additional Notes',
    success: 'Saved successfully',
    error: 'An error occurred',
    required: 'Required field',
    back: 'Back',
    next: 'Next',
    today: 'Today',
    yesterday: 'Yesterday',

    navDashboard: "Overview",
    navStudents: 'Students',
    navAttendance: "Attendance",
    navLostFound: 'Lost & Found',
    navActivity: 'Activity Log',
    navSettings: 'Settings',
    navCampusAI: 'Campus AI',
    navUsers: 'User Management',
    logout: 'Sign Out',

    globalSearchPlaceholder: 'Search students, items, records (Ctrl+K)...',
    notificationsTitle: 'Notifications',
    noNotifications: "You're all caught up! There are currently no new notifications.",
    markAllRead: 'Mark all as read',
    editProfile: 'Edit Profile',

    dashboardTitle: "Overview",
    dashboardSubtitle: "A snapshot of attendance, student records, and lost and found.",
    totalStudents: 'Total Students',
    presentToday: 'Present Today',
    absentToday: 'Absent Today',
    lostItemsPending: 'Lost Items Pending',
    attendanceOverview: 'Attendance Overview',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    registerStudentAction: 'Register a new student',
    recordAbsenceAction: 'Record an absence',
    reportFoundAction: 'Report a found item',
    viewAttendanceAction: 'View attendance records',

    studentsTitle: 'Students',
    studentsSubtitle: 'Manage and view all registered students.',
    addStudent: 'Add Student',
    studentId: 'Student ID',
    fullName: 'Full Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    className: 'Class / Grade',
    gender: 'Gender',
    dateOfBirth: 'Date of Birth',
    guardianContact: 'Guardian Contact',
    attendanceStatus: 'Attendance Status',
    viewProfile: 'View Profile',
    editStudent: 'Edit Student',
    deleteStudent: 'Delete Student',
    confirmDeleteStudent: 'Are you sure you want to delete this student record? This action cannot be undone.',
    noStudentsTitle: 'No students registered yet',
    noStudentsDesc: "Start by adding your school's students to the system.",
    registerFirstStudent: 'Register First Student',
    filterClass: 'Filter by Class',

    attendanceTitle: "Attendance",
    attendanceSubtitle: 'Monitor daily student attendance and manage absence records.',
    selectDate: 'Select Date',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    reason: 'Reason',
    absenceReason: 'Absence Reason',
    absenceType: 'Absence Type',
    markPresent: 'Mark Present',
    markAbsent: 'Mark Absent',
    markLate: 'Mark Late',
    markExcused: 'Mark Excused',
    tabDaily: 'Daily Register',
    tabHistory: 'Attendance History',
    tabReports: 'Attendance Reports',
    noAttendanceTitle: 'No attendance records',
    noAttendanceDesc: 'Attendance records will appear here once you start recording daily attendance.',
    attendanceRate: 'Daily Attendance Rate',
    totalAbsences: 'Total Absences',
    topAbsentClasses: 'Most Frequently Absent Classes',
    attendanceTrends: 'Attendance Trends Over Time',

    lostFoundTitle: 'Lost & Found',
    lostFoundSubtitle: 'Keep track of lost belongings and items found around the school.',
    totalReported: 'Total Reported Items',
    lostItems: 'Lost Items',
    foundItems: 'Found Items',
    claimedItems: 'Claimed Items',
    reportLostItem: 'Report Lost Item',
    reportFoundItem: 'Report Found Item',
    itemName: 'Item Name',
    category: 'Category',
    location: 'Location',
    reportedBy: 'Reported By',
    description: 'Description',
    markAsClaimed: 'Mark as Claimed',
    archiveItem: 'Archive Item',
    claimedBy: 'Claimed By',
    claimedDate: 'Date Claimed',
    collectedBy: 'Person Who Collected Item',
    claimNotes: 'Claim Notes',
    confirmClaim: 'Confirm Claim',
    noItemsTitle: 'No items reported yet',
    noItemsDesc: 'Lost and found reports will appear here when someone submits a report.',
    uploadPhoto: 'Upload Image / Photo',

    activityTitle: 'Activity Log',
    activitySubtitle: 'Audit trail of administrative actions across Campus OS.',
    action: 'Action',
    admin: 'Administrator',
    timestamp: 'Timestamp',
    noActivityTitle: 'No recent activity',
    noActivityDesc: 'Administrative actions will appear here automatically.',
    clearActivity: 'Clear Activity History',

    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage school system configuration, profile, and regional preferences.',
    tabGeneral: 'General',
    tabAppearance: 'Appearance',
    tabLanguageRegion: 'Language & Region',
    tabNotifications: 'Notifications',
    tabAdminProfile: 'Administrator Profile',
    tabSchoolInfo: 'School Information',
    tabSecurity: 'Security',
    tabAISettings: 'AI Assistant',

    themeMode: 'Interface Theme',
    lightTheme: 'Light Mode',
    darkTheme: 'Dark Mode',
    systemTheme: 'System Default',

    preferredLanguage: 'Application Language',
    dateFormat: 'Date Format',
    timeFormat: 'Time Format',
    timeZone: 'Time Zone',
    regionCountry: 'Regional Standard',

    adminProfileTitle: 'Administrator Profile',
    displayName: 'Display Name',
    username: 'Username',
    adminRole: 'Administrator Role',
    profilePicture: 'Profile Picture',
    changePhoto: 'Upload Photo',
    removePhoto: 'Remove Photo',
    saveChanges: 'Save Changes',
    cancelChanges: 'Cancel',

    schoolName: 'School Name',
    schoolAddress: 'Address',
    schoolCity: 'City',
    schoolCountry: 'Country',
    schoolEmail: 'Official Email',
    schoolPhone: 'Official Phone',
    schoolWebsite: 'School Website',
    schoolLogo: 'School Crest / Logo',

    aiConversations: "Conversations",
    aiNoConversations: "No conversations yet",
    aiSuggestions: "Try asking",
    aiExpand: "Open full assistant",
    aiClaimPrompt: "How can I claim an item I lost at school?",
    aiWelcomeTitle: "How can I help?",
    aiWelcomeSubtitle: "Ask about attendance, student records, or lost property.",
    aiInputPlaceholder: 'Ask about attendance stats, student counts, or lost items...',
    aiSend: 'Send Query',
    aiNewChat: 'New Conversation',
    aiClearChat: 'Clear History',
    aiGenerateReport: 'Generate Structured Report',
    aiSuggestedPrompt1: 'How many students are registered?',
    aiSuggestedPrompt2: 'How many students are absent today?',
    aiSuggestedPrompt3: 'Which class has the highest absence rate?',
    aiSuggestedPrompt4: 'How many items are currently unclaimed?',
    aiSuggestedPrompt5: "Summarize this week's attendance.",
    aiSuggestedPrompt6: 'Generate a monthly school report.',
    aiCopy: 'Copy response',
    aiCopied: 'Copied!',
    aiPrivacyNotice: 'Privacy Protected: Individual names and private contact details are never transmitted to external AI.',
    aiStatusConnected: 'Connected to Gemini API',
    aiStatusDemo: 'Demo Mode: Aggregated real statistics ready',

    loginTitle: "Sign in",
    loginButton: "Sign in",
    loginError: 'Invalid username or password. Please try again.',

    adminPortal: "Administrator sign in",
    normalUserPortal: 'Student & Parent Portal',
    adminLoginBtn: "Administrator",
    userLoginBtn: "Student / parent",
    registerBtn: 'Create Account',
    registerTitle: "Create an account",
    alreadyHaveAccount: 'Already have an account? Sign in',
    needAccount: "Don't have an account? Sign up",
    adminAccessOnly: 'Restricted Access — Authorized School Administrators Only',
    exportExcel: 'Export Excel (.xlsx)',
    exportingExcel: 'Generating Excel (.xlsx)...',
    exportConfirmTitle: 'Export Student Registry to Excel',
    exportConfirmDesc: 'You are about to export official student records into an Excel (.xlsx) file with full attendance and guardian data.',
    myReports: "My reports",
    submitReport: "Report an item",
    lostFoundCatalog: "Lost and found",
    accessDenied: 'Access Restricted',
    adminRoleRequired: 'Administrator privileges are required to access this section.',
    backToPortal: 'Return to Student Portal',
    saveToServer: 'Save to Server',
    savingToServer: 'Saving to Server...',
    studentsSavedSuccess: 'Student records saved securely to server database.',
    serverSavedBadge: 'Server Synced',

    // User Management
    usersTitle: 'User Accounts',
    usersSubtitle: 'Manage school administrators, staff, and student access accounts.',
    addUser: 'Create Account',
    userRoleAdmin: 'Administrator',
    userRoleUser: 'Student / Parent',
    confirmDeleteUser: 'Are you sure you want to delete this user account? This action cannot be undone.',
    generatePassword: 'Generate Secure Password',

    // AI Speech & Voice
    aiVoiceSpeak: 'Read aloud',
    aiVoiceListening: 'Listening... speak now',
    aiVoiceStop: 'Stop speaking',
    aiAutoSpeak: 'Auto-speak AI responses',
  },

  fr: {
    appName: 'Campus OS',
    appSubtitle: "Portail d'Administration Scolaire",
    workspaceLabel: "Espace scolaire",
    workspaceTitle: "Administration scolaire",
    workspaceDescription: "Gérez les dossiers des élèves, les présences et les objets perdus.",
    schoolOperations: "Vie scolaire",
    workspaceTools: "Outils de gestion",
    openNavigation: "Ouvrir la navigation",
    closeNavigation: "Fermer la navigation",
    accountMenu: "Menu du compte",
    verifyingSession: "Vérification de votre session…",
    signInDescription: "Connectez-vous avec votre compte élève ou parent.",
    adminSignInDescription: "Connectez-vous avec votre compte administrateur.",
    registerDescription: "Créez un compte pour consulter les objets perdus et les signaler.",
    loginIdentity: "Identifiant ou adresse e-mail",
    emailAddress: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    showPasswordLabel: "Afficher le mot de passe",
    hidePasswordLabel: "Masquer le mot de passe",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    passwordMinLength: "Utilisez au moins 10 caractères.",
    registrationError: "Impossible de créer le compte. Vérifiez vos informations et réessayez.",
    notMarked: "Non renseignés",
    reportsAwaitingReview: "Signalements à examiner",
    viewActivity: "Voir le journal",
    portalCatalogDescription: "Consultez les objets signalés perdus ou trouvés à l’école.",
    portalReportDescription: "Indiquez à l’établissement l’objet que vous avez perdu ou trouvé.",
    portalReportsDescription: "Suivez l’état de vos signalements auprès de l’établissement.",
    noMatchingItems: "Aucun objet correspondant",
    adjustFilters: "Essayez une autre recherche ou modifiez les filtres.",
    noPersonalReports: "Aucun signalement pour le moment",
    portalAIDescription: "Posez vos questions sur l’établissement et les objets perdus.",
    openAssistant: "Ouvrir l’assistant",
    totalAccounts: "Nombre de comptes",
    officialCatalog: "Catalogue de l’établissement",
    studentReports: "Signalements des élèves",
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Consulter',
    search: 'Rechercher...',
    filter: 'Filtrer',
    all: 'Tous',
    exportCsv: 'Exporter en CSV',
    confirm: 'Confirmer',
    loading: 'Chargement...',
    actions: 'Actions',
    status: 'Statut',
    date: 'Date',
    time: 'Heure',
    close: 'Fermer',
    notes: 'Remarques additionnelles',
    success: 'Enregistré avec succès',
    error: 'Une erreur est survenue',
    required: 'Champ obligatoire',
    back: 'Retour',
    next: 'Suivant',
    today: "Aujourd'hui",
    yesterday: 'Hier',

    navDashboard: "Vue d’ensemble",
    navStudents: 'Élèves',
    navAttendance: "Présences",
    navLostFound: 'Objets Trouvés',
    navActivity: "Journal d'Activité",
    navSettings: 'Paramètres',
    navCampusAI: 'Campus AI',
    navUsers: 'Gestion des Utilisateurs',
    logout: 'Déconnexion',

    globalSearchPlaceholder: 'Rechercher élèves, objets, registres (Ctrl+K)...',
    notificationsTitle: 'Notifications',
    noNotifications: 'Vous êtes à jour ! Aucune nouvelle notification pour le moment.',
    markAllRead: 'Tout marquer comme lu',
    editProfile: 'Modifier le profil',

    dashboardTitle: "Vue d’ensemble",
    dashboardSubtitle: "Un aperçu des présences, des dossiers des élèves et des objets perdus.",
    totalStudents: 'Total des Élèves',
    presentToday: "Présents Aujourd'hui",
    absentToday: "Absents Aujourd'hui",
    lostItemsPending: 'Objets en Attente',
    attendanceOverview: 'Aperçu de la Présence',
    recentActivity: 'Activité Récente',
    quickActions: 'Actions Rapides',
    registerStudentAction: 'Inscrire un nouvel élève',
    recordAbsenceAction: 'Enregistrer une absence',
    reportFoundAction: 'Signaler un objet trouvé',
    viewAttendanceAction: 'Consulter les registres',

    studentsTitle: 'Gestion des Élèves',
    studentsSubtitle: 'Consultez et gérez tous les élèves inscrits dans votre établissement.',
    addStudent: 'Ajouter un Élève',
    studentId: 'Identifiant Élève',
    fullName: 'Nom Complet',
    firstName: 'Prénom',
    lastName: 'Nom',
    className: 'Classe / Niveau',
    gender: 'Genre',
    dateOfBirth: 'Date de Naissance',
    guardianContact: 'Contact Tuteur',
    attendanceStatus: 'Statut de Présence',
    viewProfile: 'Voir le Profil',
    editStudent: "Modifier l'Élève",
    deleteStudent: "Supprimer l'Élève",
    confirmDeleteStudent: 'Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible.',
    noStudentsTitle: 'Aucun élève enregistré',
    noStudentsDesc: 'Commencez par ajouter les premiers élèves de votre école dans le système.',
    registerFirstStudent: 'Inscrire le Premier Élève',
    filterClass: 'Filtrer par Classe',

    attendanceTitle: "Présences",
    attendanceSubtitle: 'Suivez la présence quotidienne et gérez les motifs des absences.',
    selectDate: 'Choisir la Date',
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
    excused: 'Excusé',
    reason: 'Motif',
    absenceReason: "Motif d'absence",
    absenceType: "Type d'absence",
    markPresent: 'Marquer Présent',
    markAbsent: 'Marquer Absent',
    markLate: 'Marquer En Retard',
    markExcused: 'Marquer Excusé',
    tabDaily: 'Registre du Jour',
    tabHistory: 'Historique',
    tabReports: 'Rapports & Statistiques',
    noAttendanceTitle: 'Aucun registre de présence',
    noAttendanceDesc: 'Les registres apparaîtront ici dès que vous aurez commencé la saisie.',
    attendanceRate: 'Taux de Présence Quotidien',
    totalAbsences: 'Total des Absences',
    topAbsentClasses: 'Classes avec le Plus d’Absences',
    attendanceTrends: 'Évolution de la Présence dans le Temps',

    lostFoundTitle: 'Objets Trouvés & Perdus',
    lostFoundSubtitle: "Suivez les affaires perdues et les objets trouvés dans l'établissement.",
    totalReported: 'Total des Objets Signalés',
    lostItems: 'Objets Perdus',
    foundItems: 'Objets Trouvés',
    claimedItems: 'Objets Restitués',
    reportLostItem: 'Déclarer un Objet Perdu',
    reportFoundItem: 'Déclarer un Objet Trouvé',
    itemName: "Nom de l'Objet",
    category: 'Catégorie',
    location: 'Lieu',
    reportedBy: 'Signalé Par',
    description: 'Description',
    markAsClaimed: 'Marquer comme Restitué',
    archiveItem: 'Archiver',
    claimedBy: 'Restitué à',
    claimedDate: 'Date de Restitution',
    collectedBy: 'Personne ayant récupéré',
    claimNotes: 'Remarques de restitution',
    confirmClaim: 'Confirmer la Restitution',
    noItemsTitle: 'Aucun objet signalé',
    noItemsDesc: "Les signalements d'objets apparaîtront ici lors des déclarations.",
    uploadPhoto: 'Téléverser une Photo',

    activityTitle: "Journal d'Activité",
    activitySubtitle: "Historique des opérations administratives dans l'application.",
    action: 'Opération',
    admin: 'Administrateur',
    timestamp: 'Horodatage',
    noActivityTitle: 'Aucune activité récente',
    noActivityDesc: 'Les actions administratives apparaîtront automatiquement ici.',
    clearActivity: "Vider l'Historique",

    settingsTitle: 'Paramètres du Système',
    settingsSubtitle: "Configurez l'établissement, votre profil et les préférences régionales.",
    tabGeneral: 'Général',
    tabAppearance: 'Apparence',
    tabLanguageRegion: 'Langue & Région',
    tabNotifications: 'Notifications',
    tabAdminProfile: 'Profil Administrateur',
    tabSchoolInfo: "Informations de l'École",
    tabSecurity: 'Sécurité',
    tabAISettings: 'Assistant IA',

    themeMode: "Thème de l'Interface",
    lightTheme: 'Mode Clair',
    darkTheme: 'Mode Sombre',
    systemTheme: 'Défaut Système',

    preferredLanguage: "Langue de l'Application",
    dateFormat: 'Format de Date',
    timeFormat: "Format d'Heure",
    timeZone: 'Fuseau Horaire',
    regionCountry: 'Standard Régional',

    adminProfileTitle: 'Profil Administrateur',
    displayName: "Nom d'Affichage",
    username: "Nom d'Utilisateur",
    adminRole: "Rôle dans l'Établissement",
    profilePicture: 'Photo de Profil',
    changePhoto: 'Changer la Photo',
    removePhoto: 'Supprimer la Photo',
    saveChanges: 'Enregistrer les Modifications',
    cancelChanges: 'Annuler',

    schoolName: "Nom de l'Établissement",
    schoolAddress: 'Adresse',
    schoolCity: 'Ville',
    schoolCountry: 'Pays',
    schoolEmail: 'Email Officiel',
    schoolPhone: 'Téléphone Officiel',
    schoolWebsite: 'Site Internet',
    schoolLogo: "Blason / Logo de l'École",

    aiConversations: "Conversations",
    aiNoConversations: "Aucune conversation",
    aiSuggestions: "Suggestions de questions",
    aiExpand: "Ouvrir l’assistant complet",
    aiClaimPrompt: "Comment récupérer un objet perdu à l’école ?",
    aiWelcomeTitle: "Comment puis-je vous aider ?",
    aiWelcomeSubtitle: "Posez vos questions sur les présences, les dossiers des élèves ou les objets perdus.",
    aiInputPlaceholder: 'Posez une question sur les présences, élèves ou objets...',
    aiSend: 'Envoyer',
    aiNewChat: 'Nouvelle Conversation',
    aiClearChat: "Effacer l'Historique",
    aiGenerateReport: 'Générer un Rapport Structuré',
    aiSuggestedPrompt1: 'Combien d’élèves sont inscrits ?',
    aiSuggestedPrompt2: 'Combien d’élèves sont absents aujourd’hui ?',
    aiSuggestedPrompt3: 'Quelle classe a le taux d’absence le plus élevé ?',
    aiSuggestedPrompt4: 'Combien d’objets sont actuellement non réclamés ?',
    aiSuggestedPrompt5: 'Résume les présences de cette semaine.',
    aiSuggestedPrompt6: 'Génère un rapport mensuel de l’école.',
    aiCopy: 'Copier la réponse',
    aiCopied: 'Copié !',
    aiPrivacyNotice: 'Protection des données : Les noms et coordonnées privées ne sont jamais transmis aux services IA externes.',
    aiStatusConnected: 'Connecté à l’API Gemini',
    aiStatusDemo: 'Mode Démo : Statistiques réelles agrégées prêtes',

    loginTitle: "Se connecter",
    loginButton: "Se connecter",
    loginError: 'Identifiants incorrects. Veuillez réessayer.',

    adminPortal: "Connexion administrateur",
    normalUserPortal: 'Portail Étudiants & Parents',
    adminLoginBtn: "Administration",
    userLoginBtn: "Élève / parent",
    registerBtn: 'Créer un Compte',
    registerTitle: "Créer un compte",
    alreadyHaveAccount: 'Vous avez déjà un compte ? Connectez-vous',
    needAccount: 'Pas encore de compte ? Inscrivez-vous',
    adminAccessOnly: 'Accès Réservé — Administrateurs Autorisés Uniquement',
    exportExcel: 'Exporter Excel (.xlsx)',
    exportingExcel: 'Génération Excel (.xlsx)...',
    exportConfirmTitle: 'Exporter le Registre des Élèves vers Excel',
    exportConfirmDesc: 'Vous êtes sur le point de générer un classeur Excel (.xlsx) officiel avec les données de présence et tuteurs.',
    myReports: "Mes signalements",
    submitReport: "Signaler un objet",
    lostFoundCatalog: "Objets perdus et trouvés",
    accessDenied: 'Accès Refusé',
    adminRoleRequired: "Des privilèges d'administrateur sont requis pour accéder à cette section.",
    backToPortal: 'Retour au Portail Étudiant',
    saveToServer: 'Enregistrer sur le serveur',
    savingToServer: 'Enregistrement sur le serveur...',
    studentsSavedSuccess: 'Dossiers des élèves enregistrés sur le serveur avec succès.',
    serverSavedBadge: 'Synchronisé avec le serveur',

    // User Management
    usersTitle: 'Comptes Utilisateurs',
    usersSubtitle: "Gérez les comptes d'accès pour les administrateurs, le personnel et les élèves.",
    addUser: 'Créer un Compte',
    userRoleAdmin: 'Administrateur',
    userRoleUser: 'Élève / Parent',
    confirmDeleteUser: 'Êtes-vous sûr de vouloir supprimer ce compte utilisateur ? Cette action est irréversible.',
    generatePassword: 'Générer un Mot de Passe Sécurisé',

    // AI Speech & Voice
    aiVoiceSpeak: 'Lire à voix haute',
    aiVoiceListening: 'Écoute en cours... parlez maintenant',
    aiVoiceStop: 'Arrêter la lecture',
    aiAutoSpeak: 'Lecture vocale automatique',
  },

  ar: {
    appName: 'Campus OS',
    appSubtitle: 'بوابة الإدارة المدرسية المتكاملة',
    workspaceLabel: "فضاء المدرسة",
    workspaceTitle: "إدارة المدرسة",
    workspaceDescription: "إدارة ملفات الطلاب والحضور والمفقودات.",
    schoolOperations: "الإدارة المدرسية",
    workspaceTools: "أدوات العمل",
    openNavigation: "فتح قائمة التنقل",
    closeNavigation: "إغلاق قائمة التنقل",
    accountMenu: "قائمة الحساب",
    verifyingSession: "جارٍ التحقق من جلستك…",
    signInDescription: "سجّل الدخول بحساب الطالب أو ولي الأمر.",
    adminSignInDescription: "سجّل الدخول بحساب إدارة المدرسة.",
    registerDescription: "أنشئ حساباً لتصفح المفقودات وإرسال البلاغات.",
    loginIdentity: "اسم المستخدم أو البريد الإلكتروني",
    emailAddress: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    confirmPasswordLabel: "تأكيد كلمة المرور",
    showPasswordLabel: "إظهار كلمة المرور",
    hidePasswordLabel: "إخفاء كلمة المرور",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordMinLength: "استخدم 10 أحرف على الأقل.",
    registrationError: "تعذر إنشاء الحساب. تحقق من بياناتك وحاول مجدداً.",
    notMarked: "لم يُسجّل",
    reportsAwaitingReview: "بلاغات الطلاب قيد المراجعة",
    viewActivity: "عرض سجل النشاط",
    portalCatalogDescription: "تصفح الأشياء المبلّغ عن فقدانها أو العثور عليها في المدرسة.",
    portalReportDescription: "أخبر إدارة المدرسة بما فقدته أو عثرت عليه.",
    portalReportsDescription: "تابع حالة البلاغات التي أرسلتها إلى المدرسة.",
    noMatchingItems: "لا توجد نتائج مطابقة",
    adjustFilters: "جرّب بحثاً آخر أو غيّر عوامل التصفية.",
    noPersonalReports: "لا توجد بلاغات حتى الآن",
    portalAIDescription: "اطرح أسئلتك حول المدرسة والمفقودات.",
    openAssistant: "فتح المساعد",
    totalAccounts: "إجمالي الحسابات",
    officialCatalog: "دليل المدرسة",
    studentReports: "بلاغات الطلاب",
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'معاينة',
    search: 'بحث...',
    filter: 'تصفية',
    all: 'الكل',
    exportCsv: 'تصدير CSV',
    confirm: 'تأكيد',
    loading: 'جاري التحميل...',
    actions: 'إجراءات',
    status: 'الحالة',
    date: 'التاريخ',
    time: 'الوقت',
    close: 'إغلاق',
    notes: 'ملاحظات إضافية',
    success: 'تم الحفظ بنجاح',
    error: 'حدث خطأ ما',
    required: 'حقل إلزامي',
    back: 'رجوع',
    next: 'التالي',
    today: 'اليوم',
    yesterday: 'أمس',

    navDashboard: "نظرة عامة",
    navStudents: 'الطلاب',
    navAttendance: "الحضور",
    navLostFound: 'المفقودات والمعثورات',
    navActivity: 'سجل العمليات',
    navSettings: 'الإعدادات',
    navCampusAI: 'المساعد الذكي (Campus AI)',
    navUsers: 'إدارة المستخدمين والحسابات',
    logout: 'تسجيل الخروج',

    globalSearchPlaceholder: 'البحث عن طالب، مفقودات، سجلات (Ctrl+K)...',
    notificationsTitle: 'الإشعارات',
    noNotifications: 'أنت على اطلاع دائم! لا توجد إشعارات جديدة حالياً.',
    markAllRead: 'تحديد الكل كمقروء',
    editProfile: 'تعديل الملف الشخصي',

    dashboardTitle: "نظرة عامة",
    dashboardSubtitle: "ملخص للحضور وملفات الطلاب والمفقودات.",
    totalStudents: 'إجمالي الطلاب المسجلين',
    presentToday: 'الحاضرون اليوم',
    absentToday: 'الغائبون اليوم',
    lostItemsPending: 'مفقودات قيد الانتظار',
    attendanceOverview: 'نظرة عامة على الحضور والغياب',
    recentActivity: 'أحدث العمليات الإدارية',
    quickActions: 'إجراءات سريعة',
    registerStudentAction: 'تسجيل طالب جديد',
    recordAbsenceAction: 'تسجيل حالة غياب',
    reportFoundAction: 'الإبلاغ عن غرض تم العثور عليه',
    viewAttendanceAction: 'معاينة سجلات الحضور',

    studentsTitle: 'إدارة شؤون الطلاب',
    studentsSubtitle: 'إدارة وتفقد بيانات جميع الطلاب المقيدين في المؤسسة.',
    addStudent: 'إضافة طالب جديد',
    studentId: 'رقم التعريف المدرسي',
    fullName: 'الاسم الكامل',
    firstName: 'الاسم الشخصي',
    lastName: 'الاسم العائلي',
    className: 'الفصل / المستوى الدراسي',
    gender: 'الجنس',
    dateOfBirth: 'تاريخ الازدياد',
    guardianContact: 'رقم ولي الأمر',
    attendanceStatus: 'حالة الحضور',
    viewProfile: 'معاينة الملف الشخصي',
    editStudent: 'تعديل بيانات الطالب',
    deleteStudent: 'حذف سجل الطالب',
    confirmDeleteStudent: 'هل أنت متأكد من حذف سجل هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.',
    noStudentsTitle: 'لا يوجد طلاب مسجلون حتى الآن',
    noStudentsDesc: 'ابدأ بتسجيل أول طالب في مدرستك لإدارة السجلات بكفاءة.',
    registerFirstStudent: 'تسجيل أول طالب',
    filterClass: 'تصفية حسب الفصل',

    attendanceTitle: "الحضور",
    attendanceSubtitle: 'متابعة الحضور اليومي وإدارة مبررات الغياب والتأخر.',
    selectDate: 'اختيار التاريخ',
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    excused: 'غياب مبرر',
    reason: 'السبب',
    absenceReason: 'سبب الغياب',
    absenceType: 'نوع الغياب',
    markPresent: 'تسجيل كحاضر',
    markAbsent: 'تسجيل كغائب',
    markLate: 'تسجيل كمتأخر',
    markExcused: 'تسجيل كمبرر',
    tabDaily: 'سجل اليوم',
    tabHistory: 'أرشيف الحضور',
    tabReports: 'تقارير وإحصائيات',
    noAttendanceTitle: 'لا توجد سجلات حضور',
    noAttendanceDesc: 'ستظهر سجلات الحضور هنا بمجرد البدء برصد الحضور والغياب اليومي.',
    attendanceRate: 'نسبة الحضور اليومية',
    totalAbsences: 'مجموع حالات الغياب',
    topAbsentClasses: 'الفصول الأكثر تسجيلاً للغياب',
    attendanceTrends: 'مؤشر تطور الحضور عبر الزمن',

    lostFoundTitle: 'قسم المفقودات والمعثورات المدرسية',
    lostFoundSubtitle: 'تتبع الأغراض المفقودة والمعثور عليها داخل الحرم المدرسي وتوثيق استلامها.',
    totalReported: 'إجمالي البلاغات المسجلة',
    lostItems: 'أغراض مفقودة',
    foundItems: 'معثورات معلنة',
    claimedItems: 'أغراض تم تسليمها لأصحابها',
    reportLostItem: 'الإبلاغ عن غرض مفقود',
    reportFoundItem: 'الإبلاغ عن غرض تم العثور عليه',
    itemName: 'اسم الغرض / المادة',
    category: 'الفئة',
    location: 'مكان الفقد أو العثور',
    reportedBy: 'مقدم البلاغ',
    description: 'الوصف والملامح المميزة',
    markAsClaimed: 'تسليم إلى صاحبه',
    archiveItem: 'أرشفة السجل',
    claimedBy: 'تم الاستلام بواسطة',
    claimedDate: 'تاريخ الاستلام',
    collectedBy: 'اسم مستلم الغرض',
    claimNotes: 'ملاحظات وتوثيق الاستلام',
    confirmClaim: 'تأكيد التسليم الرسمي',
    noItemsTitle: 'لا توجد بلاغات مسجلة حتى الآن',
    noItemsDesc: 'ستظهر بلاغات المفقودات والمعثورات هنا فور إرسالها من قبل الطاقم أو الطلاب.',
    uploadPhoto: 'رفع صورة / وثيقة',

    activityTitle: 'سجل الأنشطة والعمليات الإدارية',
    activitySubtitle: 'سجل تدقيق شفاف لجميع الإجراءات والتعديلات التي تمت في النظام.',
    action: 'الإجراء',
    admin: 'المسؤول الإداري',
    timestamp: 'التوقيت الزمني',
    noActivityTitle: 'لا توجد عمليات مسجلة مؤخراً',
    noActivityDesc: 'ستُسجل الإجراءات الإدارية تلقائياً بمجرد إجرائها في المنظومة.',
    clearActivity: 'تفريغ السجل',

    settingsTitle: 'مركز الإعدادات المتقدمة',
    settingsSubtitle: 'تخصيص بيانات المؤسسة، الملف الشخصي، والمظهر والإعدادات الإقليمية.',
    tabGeneral: 'عام',
    tabAppearance: 'المظهر والعرض',
    tabLanguageRegion: 'اللغة والمنطقة',
    tabNotifications: 'تفضيلات الإشعارات',
    tabAdminProfile: 'الملف الشخصي للمسؤول',
    tabSchoolInfo: 'بيانات المؤسسة المدرسية',
    tabSecurity: 'الأمان والوصول',
    tabAISettings: 'إعدادات الذكاء الاصطناعي',

    themeMode: 'نمط الواجهة',
    lightTheme: 'الوضع المضيء',
    darkTheme: 'الوضع الداكن (Dark Mode)',
    systemTheme: 'تلقائي حسب نظام الجهاز',

    preferredLanguage: 'لغة الواجهة',
    dateFormat: 'تنسيق التاريخ',
    timeFormat: 'تنسيق الوقت',
    timeZone: 'المنطقة الزمنية',
    regionCountry: 'المعيار الإقليمي',

    adminProfileTitle: 'الملف الشخصي لمدير النظام',
    displayName: 'اسم العرض للمسؤول',
    username: 'اسم المستخدم للدخول',
    adminRole: 'الصفة / الدور الإداري',
    profilePicture: 'الصورة الشخصية',
    changePhoto: 'رفع صورة جديدة',
    removePhoto: 'حذف الصورة',
    saveChanges: 'حفظ التغييرات',
    cancelChanges: 'إلغاء التعديل',

    schoolName: 'اسم المؤسسة التعليمية',
    schoolAddress: 'العنوان البريدي',
    schoolCity: 'المدينة',
    schoolCountry: 'الدولة',
    schoolEmail: 'البريد الإلكتروني الرسمي',
    schoolPhone: 'رقم الهاتف الرسمي',
    schoolWebsite: 'الموقع الإلكتروني',
    schoolLogo: 'شعار / خاتم المؤسسة',

    aiConversations: "المحادثات",
    aiNoConversations: "لا توجد محادثات بعد",
    aiSuggestions: "جرّب أن تسأل",
    aiExpand: "فتح صفحة المساعد",
    aiClaimPrompt: "كيف أستعيد غرضاً فقدته في المدرسة؟",
    aiWelcomeTitle: "كيف يمكنني مساعدتك؟",
    aiWelcomeSubtitle: "اطرح أسئلتك حول الحضور أو ملفات الطلاب أو المفقودات.",
    aiInputPlaceholder: 'اسأل عن نسب الحضور، عدد الطلاب، أو ملخص المفقودات...',
    aiSend: 'إرسال الاستفسار',
    aiNewChat: 'محادثة جديدة',
    aiClearChat: 'مسح المحادثة',
    aiGenerateReport: 'إنشاء تقرير إداري مفصل',
    aiSuggestedPrompt1: 'كم عدد الطلاب المسجلين حالياً؟',
    aiSuggestedPrompt2: 'كم عدد الطلاب الغائبين اليوم؟',
    aiSuggestedPrompt3: 'ما هو الفصل الدراسي الأعلى تسجيلاً للغياب؟',
    aiSuggestedPrompt4: 'كم عدد المعثورات غير المستلمة حالياً؟',
    aiSuggestedPrompt5: 'لخص لي حالة الحضور خلال الأسبوع الجاري.',
    aiSuggestedPrompt6: 'أصدر تقريراً إحصائياً شهرياً للمؤسسة.',
    aiCopy: 'نسخ الإجابة',
    aiCopied: 'تم النسخ!',
    aiPrivacyNotice: 'حماية الخصوصية: لا يتم إرسال الأسماء الشخصية أو أرقام الهواتف أو البيانات الحساسة لأي خدمات ذكاء اصطناعي خارجية.',
    aiStatusConnected: 'متصل بنموذج Gemini الذكي',
    aiStatusDemo: 'وضع تجريبي تفاعلي: الإحصائيات المجمعة جاهزة للتحليل',

    loginTitle: "تسجيل الدخول",
    loginButton: "تسجيل الدخول",
    loginError: 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى المحاولة ثانية.',

    adminPortal: "تسجيل دخول الإدارة",
    normalUserPortal: 'بوابة الطلاب وأولياء الأمور',
    adminLoginBtn: "الإدارة",
    userLoginBtn: "طالب / ولي أمر",
    registerBtn: 'إنشاء حساب جديد',
    registerTitle: "إنشاء حساب",
    alreadyHaveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
    needAccount: 'ليس لديك حساب؟ أنشئ حساباً جديداً',
    adminAccessOnly: 'منطقة مخصصة للمسؤولين المعتمدين والمشرفين التربويين فقط',
    exportExcel: 'تصدير إكسيل (.xlsx)',
    exportingExcel: 'جاري إنشاء ملف إكسيل (.xlsx)...',
    exportConfirmTitle: 'تأكيد تصدير سجل الطلاب إلى إكسيل',
    exportConfirmDesc: 'أنت على وشك تصدير السجل المدرسي الرسمي مع تفاصيل الحضور وهواتف أولياء الأمور إلى ملف Excel مؤمن.',
    myReports: "بلاغاتي",
    submitReport: "الإبلاغ عن غرض",
    lostFoundCatalog: "المفقودات والمعثورات",
    accessDenied: 'منطقة محظورة',
    adminRoleRequired: 'يلزم الحصول على صلاحيات مدير النظام للوصول إلى هذا القسم.',
    backToPortal: 'العودة إلى بوابة الطلاب',
    saveToServer: 'حفظ على الخادم',
    savingToServer: 'جاري الحفظ على الخادم...',
    studentsSavedSuccess: 'تم حفظ سجلات الطلاب بأمان في قاعدة بيانات الخادم.',
    serverSavedBadge: 'محفوظ على الخادم',

    // User Management
    usersTitle: 'حسابات المستخدمين',
    usersSubtitle: 'إدارة وتعيين حسابات المشرفين والمسؤولين والطلاب وأولياء الأمور.',
    addUser: 'إنشاء حساب جديد',
    userRoleAdmin: 'مسؤول النظام (مدير)',
    userRoleUser: 'طالب / ولي أمر',
    confirmDeleteUser: 'هل أنت متأكد من رغبتك في حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.',
    generatePassword: 'توليد كلمة مرور قوية',

    // AI Speech & Voice
    aiVoiceSpeak: 'استماع صوتي',
    aiVoiceListening: 'جاري الاستماع... تحدث الآن',
    aiVoiceStop: 'إيقاف الصوت',
    aiAutoSpeak: 'قراءة الإجابات صوتياً تلقائياً',
  },
};
