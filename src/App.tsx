/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
import { ShieldAlert, ArrowLeft, LoaderCircle } from 'lucide-react';
import { CampusBrand } from './components/common/WorkspaceUI';

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
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToPortal}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-20 end-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
      <span className="size-2 shrink-0 rounded-full bg-brand-400" />
      <span>{message}</span>
    </div>
  );
}

const MainLayout: React.FC = () => {
  const { isVerifyingAuth, isAuthenticated, currentUser, activeTab, setActiveTab, toastMessage, t } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick Action Modals
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isReportItemModalOpen, setIsReportItemModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, isAuthenticated]);

  // 0. Session verification on cold boot / fresh link opening
  if (isVerifyingAuth) {
    return (
      <div className="grid min-h-svh place-items-center px-4">
        <div role="status" className="grid justify-items-center gap-4">
          <CampusBrand />
          <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            {t.verifyingSession}
          </p>
        </div>
      </div>
    );
  }

  // Strictly enforce authentication - unauthorized link copying cannot bypass!
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  // 1. Role = 'user' (Normal User Portal)
  if (currentUser.role === 'user') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors text-slate-900 dark:text-slate-100 antialiased">
        <UserPortalView />
        <CampusAIFloatingWidget />
        <Toast message={toastMessage} />
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
        <TopNavbar mobileOpen={mobileSidebarOpen} onOpenMobile={() => setMobileSidebarOpen(true)} />

        <main className={`workspace-content flex-1 ${activeTab === 'campus-ai' ? 'workspace-chat-content' : ''}`}>
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

      <Toast message={toastMessage} />
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
