import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  PackageSearch,
  History,
  Sparkles,
  Settings,
  LogOut,
  Shield,
  X,
  UserCog,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    adminProfile,
    logout,
    t,
    schoolInfo,
    settings,
  } = useApp();

  const isRtl = settings.language === 'ar';

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'students', label: t.navStudents, icon: Users },
    { id: 'attendance', label: t.navAttendance, icon: UserCheck },
    { id: 'lostfound', label: t.navLostFound, icon: PackageSearch },
    { id: 'users', label: t.navUsers, icon: UserCog },
    { id: 'campus-ai', label: t.navCampusAI, icon: Sparkles, badge: 'AI' },
    { id: 'activity', label: t.navActivity, icon: History },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 block leading-tight truncate">
              {t.appName}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate leading-tight">
              {schoolInfo.name}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAI = item.id === 'campus-ai';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer relative ${
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isAI
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span className="truncate flex-1 text-start">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span
                  className={`absolute inset-y-1.5 w-1 bg-blue-600 dark:bg-blue-400 rounded-full ${
                    isRtl ? 'start-0' : 'end-0'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Admin Profile Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            {adminProfile.profilePictureUrl ? (
              <img
                src={adminProfile.profilePictureUrl}
                alt={adminProfile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {getInitials(adminProfile.displayName)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
              {adminProfile.displayName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight">
              {adminProfile.role}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            title={t.logout}
            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-white dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            aria-label={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
