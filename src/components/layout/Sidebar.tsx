import { useEffect, useRef } from 'react';
import {
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Settings,
  Sparkles,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CampusBrand, WorkspaceAvatar } from '../common/WorkspaceUI';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activeTab, setActiveTab, adminProfile, logout, t, schoolInfo } = useApp();
  const drawer = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (!mobileOpen) {
      if (dialog.open) dialog.close();
      return;
    }

    const desktop = window.matchMedia('(min-width: 48rem)');
    if (desktop.matches) return;
    if (!dialog.open) dialog.showModal();

    const onResize = () => {
      if (desktop.matches && dialog.open) dialog.close();
    };
    desktop.addEventListener('change', onResize);
    return () => desktop.removeEventListener('change', onResize);
  }, [mobileOpen]);

  const groups = [
    {
      label: t.schoolOperations,
      items: [
        { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
        { id: 'students', label: t.navStudents, icon: Users },
        { id: 'attendance', label: t.navAttendance, icon: ClipboardCheck },
        { id: 'lostfound', label: t.navLostFound, icon: PackageSearch },
      ],
    },
    {
      label: t.workspaceTools,
      items: [
        { id: 'users', label: t.navUsers, icon: UserCog },
        { id: 'campus-ai', label: t.navCampusAI, icon: Sparkles },
        { id: 'activity', label: t.navActivity, icon: History },
        { id: 'settings', label: t.navSettings, icon: Settings },
      ],
    },
  ];

  const sidebar = (mobile: boolean) => (
    <div className="workspace-sidebar">
      <div className="sidebar-brand">
        <CampusBrand caption={schoolInfo.name} />
        {mobile && (
          <button type="button" autoFocus className="workspace-icon-button" onClick={onCloseMobile} aria-label={t.closeNavigation}>
            <X size={19} />
          </button>
        )}
      </div>

      <nav className="sidebar-navigation" aria-label={t.workspaceLabel}>
        {groups.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <p className="sidebar-label">{group.label}</p>
            {group.items.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-link"
                aria-current={activeTab === id ? 'page' : undefined}
                onClick={() => {
                  setActiveTab(id);
                  if (mobile) onCloseMobile();
                }}
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-account">
        <WorkspaceAvatar name={adminProfile.displayName} photo={adminProfile.profilePictureUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{adminProfile.displayName}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--nav-muted)]">{adminProfile.role}</p>
        </div>
        <button type="button" className="workspace-icon-button" onClick={logout} aria-label={t.logout} title={t.logout}>
          <LogOut size={17} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 md:block xl:w-60">
        {sidebar(false)}
      </aside>
      <dialog
        ref={drawer}
        id="workspace-navigation"
        className="sidebar-drawer"
        aria-label={t.workspaceLabel}
        onClose={onCloseMobile}
        onClick={(event) => {
          if (event.target === event.currentTarget) onCloseMobile();
        }}
      >
        {sidebar(true)}
      </dialog>
    </>
  );
}
