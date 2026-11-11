import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  History,
  PackagePlus,
  PackageSearch,
  Sparkles,
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  calculateDailyAttendance,
  calculateLostFoundStats,
  formatDateWithPattern,
} from '../../utils/analytics';
import { EmptyState } from '../common/EmptyState';
import { MetricStrip, WorkspaceHeader } from '../common/WorkspaceUI';

interface DashboardViewProps {
  onOpenAddStudent: () => void;
  onOpenReportItem: () => void;
}

const copy = {
  en: {
    focus: 'Your school day, in focus.',
    eyebrow: 'THE DAILY OVERVIEW',
    shortcuts: 'A little less clicking.',
    assistant: 'A fresh perspective on your school.',
    ask: 'Ask Campus AI',
  },
  fr: {
    focus: 'Votre journée, en toute clarté.',
    eyebrow: 'VOTRE VUE DU JOUR',
    shortcuts: 'Tout à portée de main.',
    assistant: 'Un nouveau regard sur votre école.',
    ask: 'Demander à Campus AI',
  },
  ar: {
    focus: 'يومك المدرسي، بكل وضوح.',
    eyebrow: 'نظرة على يومك',
    shortcuts: 'كل ما تحتاجه، أقرب إليك.',
    assistant: 'رؤية جديدة لمدرستك.',
    ask: 'اسأل Campus AI',
  },
};

export function DashboardView({ onOpenAddStudent, onOpenReportItem }: DashboardViewProps) {
  const {
    students,
    attendance,
    lostFoundItems,
    userReports,
    activities,
    currentDate,
    setActiveTab,
    settings,
    t,
    schoolInfo,
  } = useApp();
  const reducedMotion = useReducedMotion();
  const text = copy[settings.language];
  const daily = calculateDailyAttendance(students, attendance, currentDate);
  const lostFound = calculateLostFoundStats(lostFoundItems);
  const unmarked = Math.max(
    0,
    daily.totalStudents - daily.present - daily.late - daily.absent - daily.excused,
  );
  const pendingReports = userReports.filter((report) => report.status === 'pending').length;
  const number = new Intl.NumberFormat(settings.language);
  const metrics = [
    { label: t.totalStudents, value: daily.totalStudents, icon: GraduationCap },
    { label: t.presentToday, value: daily.present, icon: UserCheck },
    { label: t.absentToday, value: daily.absent, icon: UserX },
    { label: t.lostItemsPending, value: lostFound.pendingUnclaimed, icon: PackageSearch },
  ];
  const breakdown = [
    { label: t.present, count: daily.present, color: 'bg-emerald-500' },
    { label: t.late, count: daily.late, color: 'bg-amber-500' },
    { label: t.absent, count: daily.absent, color: 'bg-rose-500' },
    { label: t.excused, count: daily.excused, color: 'bg-brand-400' },
    { label: t.notMarked, count: unmarked, color: 'bg-slate-300 dark:bg-slate-600' },
  ];
  const actions = [
    { label: t.registerStudentAction, icon: UserPlus, onClick: onOpenAddStudent },
    {
      label: t.recordAbsenceAction,
      icon: ClipboardCheck,
      onClick: () => setActiveTab('attendance'),
    },
    { label: t.reportFoundAction, icon: PackagePlus, onClick: onOpenReportItem },
  ];
  const circumference = 2 * Math.PI * 66;

  return (
    <div className="workspace-page dashboard-page">
      <WorkspaceHeader title={t.dashboardTitle} description={schoolInfo.name}>
        <time dateTime={currentDate} className="dashboard-date">
          <CalendarDays size={16} aria-hidden="true" />
          {formatDateWithPattern(currentDate, settings.dateFormat)}
        </time>
      </WorkspaceHeader>

      <section className="dashboard-hero">
        <div className="hero-orbits" aria-hidden="true">
          <span />
          <span />
          <span />
          <GraduationCap />
        </div>
        <div className="relative z-1">
          <p className="hero-eyebrow">
            <span />
            {text.eyebrow}
          </p>
          <h2>{text.focus}</h2>
          <p className="hero-description">{t.dashboardSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              className="workspace-button hero-primary"
              aria-label={t.viewAttendanceAction}
              onClick={() => setActiveTab('attendance')}
            >
              <ClipboardCheck size={17} />
              {t.navAttendance}
              <ArrowRight size={16} className="rtl:rotate-180" />
            </button>
            <button
              type="button"
              className="workspace-button hero-secondary"
              onClick={onOpenAddStudent}
            >
              <UserPlus size={17} />
              {t.addStudent}
            </button>
          </div>
        </div>
      </section>

      <MetricStrip items={metrics} />

      {pendingReports > 0 && (
        <button type="button" className="review-notice" onClick={() => setActiveTab('lostfound')}>
          <span className="review-notice-icon">
            <PackageSearch size={20} aria-hidden="true" />
          </span>
          <span className="flex-1 text-start">
            {t.reportsAwaitingReview}
            <strong className="ms-2">{number.format(pendingReports)}</strong>
          </span>
          <ArrowRight size={17} className="rtl:rotate-180" aria-hidden="true" />
        </button>
      )}

      <div className="dashboard-grid">
        <section className="workspace-panel attendance-overview">
          <div className="workspace-panel-header">
            <h2>{t.attendanceOverview}</h2>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className="workspace-link"
            >
              {t.viewAttendanceAction}
              <ArrowRight size={15} className="rtl:rotate-180" />
            </button>
          </div>
          {daily.totalStudents === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={t.noAttendanceTitle}
              description={t.noAttendanceDesc}
              actionButton={{
                label: t.registerFirstStudent,
                onClick: onOpenAddStudent,
                icon: UserPlus,
              }}
            />
          ) : (
            <div className="attendance-visual">
              <div className="attendance-donut">
                <svg viewBox="0 0 160 160" aria-hidden="true">
                  <circle cx="80" cy="80" r="66" className="donut-track" />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="66"
                    className="donut-progress"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - daily.attendanceRate / 100) }}
                    transition={{ duration: reducedMotion ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <div>
                  <strong>
                    {number.format(daily.attendanceRate)}
                    <small>%</small>
                  </strong>
                  <span>{t.attendanceRate}</span>
                </div>
              </div>
              <dl className="attendance-legend">
                {breakdown.map(({ label, count, color }) => (
                  <div key={label}>
                    <dt>
                      <span className={color} aria-hidden="true" />
                      {label}
                    </dt>
                    <dd>{number.format(count)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
        <section className="workspace-panel shortcuts-panel">
          <div className="workspace-panel-header">
            <div>
              <h2>{t.quickActions}</h2>
              <p>{text.shortcuts}</p>
            </div>
          </div>
          <div className="shortcut-list">
            {actions.map(({ label, icon: Icon, onClick }) => (
              <button key={label} type="button" onClick={onClick} className="workspace-action-row">
                <span className="shortcut-icon">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span>{label}</span>
                <ArrowRight size={16} className="rtl:rotate-180" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-grid dashboard-bottom-grid">
        <section className="workspace-panel">
          <div className="workspace-panel-header">
            <h2>{t.recentActivity}</h2>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className="workspace-link"
            >
              {t.viewActivity}
              <ArrowRight size={15} className="rtl:rotate-180" />
            </button>
          </div>
          {activities.length === 0 ? (
            <EmptyState icon={History} title={t.noActivityTitle} description={t.noActivityDesc} />
          ) : (
            <ul className="activity-timeline">
              {activities.slice(0, 4).map((activity) => (
                <li key={activity.id}>
                  <span className="activity-timeline-icon">
                    <History size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">{activity.description}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {activity.administrator}
                    </p>
                  </div>
                  <time dateTime={activity.timestamp}>
                    {new Date(activity.timestamp).toLocaleTimeString(settings.language, {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: settings.timeFormat === '12h',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="dashboard-ai-card">
          <div className="ai-orb" aria-hidden="true">
            <Sparkles size={28} />
          </div>
          <p className="text-xs font-semibold tracking-wider uppercase text-brand-600 dark:text-brand-300">
            {t.navCampusAI}
          </p>
          <h2>{text.assistant}</h2>
          <p>{t.aiWelcomeSubtitle}</p>
          <button
            type="button"
            className="workspace-button workspace-button-primary"
            onClick={() => setActiveTab('campus-ai')}
          >
            {text.ask}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </button>
        </section>
      </div>
    </div>
  );
}
