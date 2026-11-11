import { ClipboardCheck, LayoutDashboard, Menu, PackageSearch, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';

export function MobileNavigation({ onOpenMore }: { onOpenMore: () => void }) {
  const { activeTab, setActiveTab, t, settings } = useApp();
  const moreLabel = { en: 'More', fr: 'Plus', ar: 'المزيد' }[settings.language];
  const tabs = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'students', label: t.navStudents, icon: Users },
    { id: 'attendance', label: t.navAttendance, icon: ClipboardCheck },
    { id: 'lostfound', label: t.navLostFound, icon: PackageSearch },
  ];
  return (
    <nav className="mobile-navigation md:hidden" aria-label={t.schoolOperations}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={activeTab === id ? 'page' : undefined}
          onClick={() => setActiveTab(id)}
        >
          {activeTab === id && (
            <motion.span
              layoutId="mobile-nav-active"
              className="mobile-nav-active"
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onOpenMore}
        aria-label={t.openNavigation}
        aria-controls="workspace-navigation"
      >
        <Menu size={20} aria-hidden="true" />
        <span>{moreLabel}</span>
      </button>
    </nav>
  );
}
