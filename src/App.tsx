/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { UserPortalView } from './components/portal/UserPortalView';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { LostFoundView } from './components/lostfound/LostFoundView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { SettingsView } from './components/settings/SettingsView';
import { CampusAIView } from './components/ai/CampusAIView';
import { CampusAIFloatingWidget } from './components/ai/CampusAIFloatingWidget';
import { StudentModal } from './components/students/StudentModal';
import { ItemModal } from './components/lostfound/ItemModal';
import { UserManagementView } from './components/users/UserManagementView';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AccessDeniedView: React.FC<{ onReturnToPortal: () => void }> = ({ onReturnToPortal }) => {
  const { t } = useApp();
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white dark:bg-slate-900 rounded-2xl p-8 border border-red-200 dark:border-red-900/50 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.accessDenied}
        </h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          {t.adminRoleRequired}
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onReturnToPortal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToPortal}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { isAuthenticated, currentUser, activeTab, setActiveTab, toastMessage } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick Action Modals
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isReportItemModalOpen, setIsReportItemModalOpen] = useState(false);

  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  // 1. Role = 'user' (Normal User Portal)
  if (currentUser.role === 'user') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors text-slate-900 dark:text-slate-100 antialiased">
        <UserPortalView />
        <CampusAIFloatingWidget />
        {toastMessage && (
          <div className="fixed bottom-6 end-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. Role = 'admin' (Administrator Dashboard & Management)
  const adminTabs = ['dashboard', 'students', 'attendance', 'lostfound', 'users', 'campus-ai', 'activity', 'settings'];
  const isValidAdminTab = adminTabs.includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors text-slate-900 dark:text-slate-100 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopNavbar onOpenMobile={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {!isValidAdminTab && (
            <AccessDeniedView onReturnToPortal={() => setActiveTab('dashboard')} />
          )}
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
              onOpenReportItem={() => setIsReportItemModalOpen(true)}
            />
          )}
          {activeTab === 'students' && <StudentsView />}
          {activeTab === 'attendance' && <AttendanceView />}
          {activeTab === 'lostfound' && <LostFoundView />}
          {activeTab === 'users' && <UserManagementView />}
          {activeTab === 'campus-ai' && <CampusAIView />}
          {activeTab === 'activity' && <ActivityLogView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal />

      {/* Quick Action Student Modal */}
      <StudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
      />

      {/* Quick Action Found Item Modal */}
      <ItemModal
        isOpen={isReportItemModalOpen}
        onClose={() => setIsReportItemModalOpen(false)}
        reportType="found"
      />

      {/* Floating Campus AI Assistant */}
      <CampusAIFloatingWidget />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 end-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-slate-700 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
