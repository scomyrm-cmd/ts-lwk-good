/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
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

const MainLayout: React.FC = () => {
  const { isAuthenticated, activeTab, toastMessage } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick Action Modals
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isReportItemModalOpen, setIsReportItemModalOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
              onOpenReportItem={() => setIsReportItemModalOpen(true)}
            />
          )}
          {activeTab === 'students' && <StudentsView />}
          {activeTab === 'attendance' && <AttendanceView />}
          {activeTab === 'lostfound' && <LostFoundView />}
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
