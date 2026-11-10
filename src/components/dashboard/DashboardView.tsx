import { ArrowRight, CalendarDays, ClipboardCheck, GraduationCap, History, PackagePlus, PackageSearch, Sparkles, UserCheck, UserPlus, UserX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateDailyAttendance, calculateLostFoundStats, formatDateWithPattern } from '../../utils/analytics';
import { EmptyState } from '../common/EmptyState';
import { MetricStrip, WorkspaceHeader } from '../common/WorkspaceUI';

interface DashboardViewProps {
  onOpenAddStudent: () => void;
  onOpenReportItem: () => void;
}

export function DashboardView({ onOpenAddStudent, onOpenReportItem }: DashboardViewProps) {
  const {
    students, attendance, lostFoundItems, userReports, activities, currentDate, setActiveTab, settings, t,
  } = useApp();
  const daily = calculateDailyAttendance(students, attendance, currentDate);
  const lostFound = calculateLostFoundStats(lostFoundItems);
  const unmarked = daily.totalStudents - daily.present - daily.late - daily.absent - daily.excused;
  const pendingReports = userReports.filter((report) => report.status === 'pending').length;
  const formatNumber = new Intl.NumberFormat(settings.language);

  const metrics = [
    { label: t.totalStudents, value: daily.totalStudents, icon: GraduationCap },
    { label: t.presentToday, value: daily.present, icon: UserCheck },
    { label: t.absentToday, value: daily.absent, icon: UserX },
    { label: t.lostItemsPending, value: lostFound.pendingUnclaimed, icon: PackageSearch },
  ];

  const breakdown = [
    { label: t.present, count: daily.present, color: 'bg-brand-600 dark:bg-brand-400' },
    { label: t.late, count: daily.late, color: 'bg-amber-600 dark:bg-amber-500' },
    { label: t.absent, count: daily.absent, color: 'bg-rose-700 dark:bg-rose-400' },
    { label: t.excused, count: daily.excused, color: 'bg-slate-500' },
    { label: t.notMarked, count: unmarked, color: 'bg-slate-200 dark:bg-slate-700' },
  ];

  const actions = [
    { label: t.registerStudentAction, icon: UserPlus, onClick: onOpenAddStudent },
    { label: t.recordAbsenceAction, icon: ClipboardCheck, onClick: () => setActiveTab('attendance') },
    { label: t.reportFoundAction, icon: PackagePlus, onClick: onOpenReportItem },
    { label: t.navCampusAI, icon: Sparkles, onClick: () => setActiveTab('campus-ai') },
  ];

  return (
    <div className="workspace-page">
      <WorkspaceHeader title={t.dashboardTitle} description={t.dashboardSubtitle}>
        <time dateTime={currentDate} className="workspace-button cursor-default text-slate-600 dark:text-slate-300">
          <CalendarDays size={16} aria-hidden="true" />
          {formatDateWithPattern(currentDate, settings.dateFormat)}
        </time>
      </WorkspaceHeader>

      <MetricStrip items={metrics} />

      {pendingReports > 0 && (
        <div className="workspace-panel flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <PackageSearch size={17} className="text-brand-600 dark:text-brand-300" aria-hidden="true" />
            {t.reportsAwaitingReview}
            <span className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {formatNumber.format(pendingReports)}
            </span>
          </p>
          <button type="button" className="workspace-link" onClick={() => setActiveTab('lostfound')}>
            {t.navLostFound}<ArrowRight size={15} className="rtl:rotate-180" />
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="workspace-panel flex flex-col">
          <div className="workspace-panel-header">
            <h2>{t.attendanceOverview}</h2>
            <button type="button" onClick={() => setActiveTab('attendance')} className="workspace-link">
              {t.viewAttendanceAction}<ArrowRight size={15} className="rtl:rotate-180" />
            </button>
          </div>

          {daily.totalStudents === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={t.noAttendanceTitle}
              description={t.noAttendanceDesc}
              actionButton={{ label: t.registerFirstStudent, onClick: onOpenAddStudent, icon: UserPlus }}
            />
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-5">
              <div className="flex items-end justify-between gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t.attendanceRate}</span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatNumber.format(daily.attendanceRate)}%
                </span>
              </div>
              <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {breakdown.map(({ label, count, color }) => (
                  <span key={label} className={color} style={{ width: `${count / daily.totalStudents * 100}%` }} />
                ))}
              </div>
              <dl className="flex flex-wrap gap-x-5 gap-y-3">
                {breakdown.map(({ label, count, color }) => (
                  <div className="flex items-center gap-1.5 text-xs" key={label}>
                    <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
                    <dt className="text-slate-600 dark:text-slate-400">{label}</dt>
                    <dd className="font-semibold tabular-nums">{formatNumber.format(count)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>

        <section className="workspace-panel overflow-hidden">
          <div className="workspace-panel-header"><h2>{t.quickActions}</h2></div>
          {actions.map(({ label, icon: Icon, onClick }) => (
            <button key={label} type="button" onClick={onClick} className="workspace-action-row focus-visible:outline-offset-[-3px]">
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
              <ArrowRight size={15} className="rtl:rotate-180" aria-hidden="true" />
            </button>
          ))}
        </section>
      </div>

      <section className="workspace-panel">
        <div className="workspace-panel-header">
          <h2>{t.recentActivity}</h2>
          <button type="button" onClick={() => setActiveTab('activity')} className="workspace-link">
            {t.viewActivity}<ArrowRight size={15} className="rtl:rotate-180" />
          </button>
        </div>

        {activities.length === 0 ? (
          <EmptyState icon={History} title={t.noActivityTitle} description={t.noActivityDesc} />
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {activities.slice(0, 5).map((activity) => (
              <li key={activity.id} className="flex items-start gap-3 px-5 py-3">
                <History size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">{activity.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{activity.administrator}</p>
                </div>
                <time dateTime={activity.timestamp} className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(activity.timestamp).toLocaleTimeString(settings.language, {
                    hour: '2-digit', minute: '2-digit', hour12: settings.timeFormat === '12h',
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
