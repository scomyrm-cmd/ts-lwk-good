import React from 'react';
import {
  GraduationCap,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  PackageSearch,
  UserPlus,
  CalendarCheck,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  Database,
  History,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateDailyAttendance, calculateLostFoundStats, formatDateWithPattern } from '../../utils/analytics';
import { EmptyState } from '../common/EmptyState';

interface DashboardViewProps {
  onOpenAddStudent: () => void;
  onOpenReportItem: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddStudent,
  onOpenReportItem,
}) => {
  const {
    students,
    attendance,
    lostFoundItems,
    activities,
    currentDate,
    setActiveTab,
    adminProfile,
    seedDemoData,
    settings,
    t,
  } = useApp();

  const dailyStats = calculateDailyAttendance(students, attendance, currentDate);
  const lfStats = calculateLostFoundStats(lostFoundItems);

  const formattedDate = formatDateWithPattern(currentDate, settings.dateFormat);

  const statCards = [
    {
      id: 'total-students',
      label: t.totalStudents,
      value: dailyStats.totalStudents,
      icon: GraduationCap,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/30',
      badge: 'Active Enrolled',
    },
    {
      id: 'present-today',
      label: t.presentToday,
      value: dailyStats.present,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      badge: `${dailyStats.attendanceRate}% Attendance`,
    },
    {
      id: 'absent-today',
      label: t.absentToday,
      value: dailyStats.absent,
      icon: UserX,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-100 dark:border-rose-900/30',
      badge: `${dailyStats.late} Late · ${dailyStats.excused} Excused`,
    },
    {
      id: 'lost-items-pending',
      label: t.lostItemsPending,
      value: lfStats.pendingUnclaimed,
      icon: PackageSearch,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/30',
      badge: `${lfStats.claimedCount} Claimed`,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t.dashboardTitle}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.dashboardSubtitle.replace('Administrator', adminProfile.displayName)}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
            <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{formattedDate}</span>
          </div>

          {students.length === 0 && (
            <button
              type="button"
              onClick={seedDemoData}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer"
              title="Populate 20 fictional student records to test dashboard features"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Load Sample Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {card.value.toLocaleString()}
                </div>
                <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {card.badge}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Attendance Overview + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Breakdown Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t.attendanceOverview}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Breakdown of student presence today ({formattedDate})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t.viewAttendanceAction}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {dailyStats.totalStudents === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10">
              <EmptyState
                icon={CalendarCheck}
                title={t.noAttendanceTitle}
                description={t.noAttendanceDesc}
                actionButton={{
                  label: t.registerFirstStudent,
                  onClick: onOpenAddStudent,
                  icon: UserPlus,
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress bar composite */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span>Daily Attendance Rate</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">
                    {dailyStats.attendanceRate}%
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${dailyStats.attendanceRate}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                    title={`Present: ${dailyStats.present}`}
                  />
                  <div
                    style={{
                      width: `${
                        dailyStats.totalStudents > 0
                          ? (dailyStats.late / dailyStats.totalStudents) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-amber-400 transition-all duration-500"
                    title={`Late: ${dailyStats.late}`}
                  />
                  <div
                    style={{
                      width: `${
                        dailyStats.totalStudents > 0
                          ? (dailyStats.absent / dailyStats.totalStudents) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-rose-500 transition-all duration-500"
                    title={`Absent: ${dailyStats.absent}`}
                  />
                </div>
              </div>

              {/* Attendance categories 4-grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.present}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {dailyStats.present}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                    <UserX className="w-4 h-4" />
                    <span>{t.absent}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {dailyStats.absent}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>{t.late}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {dailyStats.late}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                    <CalendarCheck className="w-4 h-4" />
                    <span>{t.excused}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {dailyStats.excused}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              {t.quickActions}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Frequently accessed administrative tasks
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onOpenAddStudent}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-start transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t.registerStudentAction}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-start transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t.recordAbsenceAction}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onOpenReportItem}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-start transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t.reportFoundAction}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('campus-ai')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-900/40 text-start transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600 text-white">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                    Campus AI Insights & Reports
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.recentActivity}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live audit trail of administrative entries and updates
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activities.length === 0 ? (
          <EmptyState
            icon={History}
            title={t.noActivityTitle}
            description={t.noActivityDesc}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {act.description}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      By {act.administrator}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                  {new Date(act.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
