import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguageControl, WorkspaceAvatar } from '../common/WorkspaceUI';

interface TopNavbarProps {
  mobileOpen: boolean;
  onOpenMobile: () => void;
}

export function TopNavbar({ mobileOpen, onOpenMobile }: TopNavbarProps) {
  const {
    activeTab, setActiveTab, setSettingsSubTab, setGlobalSearchOpen, notifications,
    markNotificationRead, markAllNotificationsRead, adminProfile, logout, settings, updateSettings, t,
  } = useApp();

  const [panel, setPanel] = useState<'notifications' | 'account' | null>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!panel) return;
    const container = panel === 'notifications' ? notificationsRef.current : accountRef.current;
    const closeOutside = (event: PointerEvent) => {
      if (!container?.contains(event.target as Node)) setPanel(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanel(null);
        container?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [panel]);

  const titles: Record<string, string> = {
    dashboard: t.navDashboard,
    students: t.navStudents,
    attendance: t.navAttendance,
    lostfound: t.navLostFound,
    users: t.navUsers,
    'campus-ai': t.navCampusAI,
    activity: t.navActivity,
    settings: t.navSettings,
  };
  const openSettings = (profile: boolean) => {
    setActiveTab('settings');
    if (profile) setSettingsSubTab('admin-profile');
    setPanel(null);
  };

  return (
    <header className="workspace-topbar sticky top-0 z-30">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobile}
          className="workspace-icon-button md:hidden"
          aria-label={t.openNavigation}
          aria-controls="workspace-navigation"
          aria-expanded={mobileOpen}
        >
          <Menu size={20} />
        </button>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden truncate text-slate-500 dark:text-slate-400 lg:inline">{t.workspaceLabel}</span>
          <span className="hidden text-slate-300 dark:text-slate-600 lg:inline" aria-hidden="true">/</span>
          <span className="truncate font-semibold">{titles[activeTab] ?? t.appName}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setGlobalSearchOpen(true)}
          className="topbar-search workspace-button min-h-9 px-2.5 text-slate-600 dark:text-slate-300"
          title={t.globalSearchPlaceholder}
          aria-label={t.search}
        >
          <Search size={16} />
          <span className="hidden sm:inline">{t.search}</span>
        </button>

        <button type="button" className="workspace-icon-button theme-toggle" aria-label={settings.theme === 'dark' ? t.lightTheme : t.darkTheme} onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}>
          {settings.theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            className="workspace-icon-button relative"
            aria-label={t.notificationsTitle}
            aria-expanded={panel === 'notifications'}
            onClick={() => setPanel(panel === 'notifications' ? null : 'notifications')}
          >
            <Bell size={19} />
            {unreadCount > 0 && <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900" />}
          </button>

          {panel === 'notifications' && (
            <div className="workspace-panel workspace-popover absolute end-0 z-50 mt-2 w-[min(24rem,calc(100vw-5.75rem))] shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold">{t.notificationsTitle}{unreadCount > 0 ? ` · ${unreadCount}` : ''}</p>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllNotificationsRead} className="workspace-link">
                    <CheckCheck size={15} />
                    {t.markAllRead}
                  </button>
                )}
              </div>
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {notifications.length === 0 && <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">{t.noNotifications}</p>}
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markNotificationRead(notification.id)}
                    className={`block w-full px-4 py-3 text-start hover:bg-slate-50 focus-visible:outline-offset-[-3px] dark:hover:bg-slate-800 ${!notification.read ? 'bg-brand-50 dark:bg-brand-950/60' : ''}`}
                  >
                    <span className="flex items-start justify-between gap-2 text-sm font-semibold">
                      <span>{notification.title}</span>
                      <time className="shrink-0 text-xs font-normal text-slate-500 dark:text-slate-400" dateTime={notification.createdAt}>
                        {new Date(notification.createdAt).toLocaleTimeString(settings.language, {
                          hour: '2-digit', minute: '2-digit', hour12: settings.timeFormat === '12h',
                        })}
                      </time>
                    </span>
                    <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{notification.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={accountRef}>
          <button
            type="button"
            className="flex min-h-10 items-center gap-2 rounded-lg p-1 hover:bg-slate-50 dark:hover:bg-slate-800 sm:ps-2"
            aria-label={t.accountMenu}
            aria-expanded={panel === 'account'}
            onClick={() => setPanel(panel === 'account' ? null : 'account')}
          >
            <WorkspaceAvatar name={adminProfile.displayName} photo={adminProfile.profilePictureUrl} />
            <span className="hidden max-w-32 truncate text-sm font-medium xl:inline">{adminProfile.displayName}</span>
            <ChevronDown size={15} className="hidden text-slate-500 sm:block" />
          </button>

          {panel === 'account' && (
            <div className="workspace-panel workspace-popover absolute end-0 z-50 mt-2 w-64 shadow-lg">
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <WorkspaceAvatar name={adminProfile.displayName} photo={adminProfile.profilePictureUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{adminProfile.displayName}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{adminProfile.role}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400">{t.preferredLanguage}</span>
                <LanguageControl />
              </div>
              <div className="p-1.5">
                <button type="button" onClick={() => openSettings(true)} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <User size={16} /> {t.editProfile}
                </button>
                <button type="button" onClick={() => openSettings(false)} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Settings size={16} /> {t.navSettings}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanel(null);
                    void logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <LogOut size={16} /> {t.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
