import { useEffect } from 'react';
import { motion } from 'motion/react';
import { fluidSpring, useDialogMotion } from '../common/FluidMotion';
import {
  ClipboardCheck,
  Newspaper,
  ExternalLink,
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
  const { activeTab, setActiveTab, adminProfile, logout, t, schoolInfo, settings } = useApp();
  const drawer = useDialogMotion(mobileOpen, true);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 48rem)');
    const onResize = () => {
      if (desktop.matches && mobileOpen) onCloseMobile();
    };
    onResize();
    desktop.addEventListener('change', onResize);
    return () => desktop.removeEventListener('change', onResize);
  }, [mobileOpen, onCloseMobile]);

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
      label: {fr:'Site & médias',ar:'الموقع والإعلام',en:'Website & media'}[settings.language],
      items: [{id:'content',label:{fr:'Gestion des publications',ar:'إدارة المنشورات',en:'Manage publications'}[settings.language],icon:Newspaper}],
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
        <a href="/" className="sidebar-link"><ExternalLink size={19}/><span>{{fr:"Site public",ar:"الموقع العام",en:"Public website"}[settings.language]}</span></a>
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
                {activeTab === id && <motion.span className="sidebar-active" layoutId={mobile ? 'mobile-sidebar-active' : 'desktop-sidebar-active'} transition={fluidSpring} />}
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span className="relative min-w-0 flex-1">{label}</span>{id === 'campus-ai' && <span className="sidebar-ai-dot" aria-hidden="true" />}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <button type="button" className="sidebar-ai-card" onClick={() => { setActiveTab('campus-ai'); if (mobile) onCloseMobile(); }}>
        <span className="sidebar-ai-orb" aria-hidden="true"><Sparkles size={21} /></span>
        <span><strong>{t.navCampusAI}</strong><small>{t.aiSuggestions}</small></span>
      </button>
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
      <aside className="sidebar-desktop sticky top-0 hidden h-dvh w-60 shrink-0 md:block xl:w-64">
        {sidebar(false)}
      </aside>
      <dialog
        ref={drawer}
        id="workspace-navigation"
        className="sidebar-drawer"
        aria-label={t.workspaceLabel}
        onCancel={(event) => { event.preventDefault(); onCloseMobile(); }}
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
