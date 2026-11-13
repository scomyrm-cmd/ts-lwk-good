import { periodLabels } from '../../utils/lessonPeriods';
import { DocumentScanner } from '../ai/DocumentScanner';
import React, { useState } from 'react';
import {
  CalendarCheck,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Edit2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MetricStrip, WorkspaceHeader } from '../common/WorkspaceUI';
import { Student, AttendanceStatus } from '../../types';
import {
  calculateDailyAttendance,
  calculateClassAttendance,
  formatDateWithPattern,
  exportToCSV,
} from '../../utils/analytics';
import { EmptyState } from '../common/EmptyState';
import { AbsenceModal } from './AbsenceModal';
import { AttendanceEmails } from './AttendanceEmails';
import { schoolDate } from '../../utils/dates';

export const AttendanceView: React.FC = () => {
  const {
    students,
    attendance,
    currentDate,
    setCurrentDate,
    markAttendance,
    deleteAttendanceRecord,
    settings,
    t,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'history' | 'reports'>('daily');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal state
  const [absenceModalStudent, setAbsenceModalStudent] = useState<Student | null>(null);
  const [absenceModalStatus, setAbsenceModalStatus] = useState<AttendanceStatus>('absent');
  const [absenceModalReason, setAbsenceModalReason] = useState('');
  const [absenceModalNotes, setAbsenceModalNotes] = useState('');

  // Daily statistics for the chosen currentDate
  const dailyStats = calculateDailyAttendance(students, attendance, currentDate);
  const classBreakdown = calculateClassAttendance(students, attendance, currentDate);

  const classes = Array.from(new Set(students.map((s) => s.className))).sort();

  // Records for current date
  const recordsForDate = attendance.filter((r) => r.date === currentDate);
  const recordMap = new Map<string, typeof recordsForDate[0]>();
  recordsForDate.forEach((r) => recordMap.set(r.studentId, r));

  // Filter students for daily register
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === '' ||
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === 'all' || student.className === selectedClass;

    const record = recordMap.get(student.studentId);
    const status = record?.status || 'unmarked';
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unmarked' && status === 'unmarked') ||
      status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Date navigation helpers
  const handleDateChange = (daysDelta: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + daysDelta);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const getTodayStr = () => schoolDate(settings.timeZone);
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const openAbsenceModal = (student: Student, defaultStatus: AttendanceStatus = 'absent') => {
    const rec = recordMap.get(student.studentId);
    setAbsenceModalStudent(student);
    setAbsenceModalStatus(rec?.status || defaultStatus);
    setAbsenceModalReason(rec?.reason || '');
    setAbsenceModalNotes(rec?.notes || '');
  };

  const handleExportAttendance = () => {
    const headers = ['Date', 'Student ID', 'Student Name', 'Class', 'Status', 'Time', 'Reason', 'Notes'];
    const rows = students.map((s) => {
      const rec = recordMap.get(s.studentId);
      return [
        currentDate,
        s.studentId,
        `${s.firstName} ${s.lastName}`,
        s.className,
        rec?.status || 'Unmarked',
        rec?.time || '',
        rec?.reason || '',
        rec?.notes || '',
      ];
    });
    exportToCSV(`attendance_register_${currentDate}`, headers, rows);
  };

  // Generate 7-day trend for reports tab
  const past7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dt = d.toISOString().split('T')[0];
    const stat = calculateDailyAttendance(students, attendance, dt);
    return {
      date: dt,
      label: formatDateWithPattern(dt, settings.dateFormat),
      rate: stat.attendanceRate,
      present: stat.present,
      absent: stat.absent,
    };
  });

  return (
    <div className="workspace-page">
      <WorkspaceHeader title={t.attendanceTitle} description={t.attendanceSubtitle}>
        <DocumentScanner mode="attendance" />
        {students.length > 0 && (
          <button type="button" onClick={handleExportAttendance} className="workspace-button">
            <Download size={16} />
            {t.exportCsv}
          </button>
        )}
      </WorkspaceHeader>

      <nav className="workspace-tabs" aria-label={t.attendanceTitle}>
        {([
          { id: 'daily', label: t.tabDaily },
          { id: 'history', label: t.tabHistory },
          { id: 'reports', label: t.tabReports },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="workspace-tab"
            aria-current={activeSubTab === id ? 'page' : undefined}
            onClick={() => setActiveSubTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* TAB 1: DAILY REGISTER */}
      {activeSubTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Selector Banner */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.selectDate}:
              </span>
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleDateChange(-1)}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  aria-label={t.selectDate}
                  className="px-2 py-1 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => handleDateChange(1)}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentDate(getTodayStr())}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentDate === getTodayStr()
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {t.today}
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(getYesterdayStr())}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentDate === getYesterdayStr()
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {t.yesterday}
              </button>
            </div>
          </div>

          <MetricStrip items={[
            { label: t.totalStudents, value: dailyStats.totalStudents },
            { label: t.present, value: dailyStats.present },
            { label: t.absent, value: dailyStats.absent },
            { label: t.late, value: dailyStats.late },
            { label: t.excused, value: dailyStats.excused },
          ]} />

          {/* Daily Student Register Table */}
          {students.length === 0 ? (
            <div className="workspace-panel">
              <EmptyState icon={CalendarCheck} title={t.noStudentsTitle} description={t.noStudentsDesc} />
            </div>
          ) : (
            <div className="workspace-panel overflow-hidden">
              {/* Table Filter Controls */}
              <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-3 dark:border-slate-800 md:flex-row md:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students in daily register..."
                    className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                    <option value="unmarked">Unmarked</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="daily-register-table w-full text-start text-xs md:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 text-start">{t.studentId}</th>
                      <th className="py-3 px-4 text-start">{t.fullName}</th>
                      <th className="py-3 px-4 text-start">{t.className}</th>
                      <th className="py-3 px-4 text-start">{t.status}</th>
                      <th className="py-3 px-4 text-start">{t.time}</th>
                      <th className="py-3 px-4 text-start">{t.reason}</th>
                      <th className="py-3 px-4 text-end">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-xs text-slate-400">
                          No students matched your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const rec = recordMap.get(student.studentId);
                        const status = rec?.status;

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                              {student.studentId}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                              {student.firstName} {student.lastName}
                              <span className="student-mobile-meta">{student.studentId} · {student.className}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                              {student.className}
                            </td>
                            <td className="py-3 px-4">
                              {status === 'present' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{t.present}</span>
                                </span>
                              )}
                              {status === 'absent' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                  <UserX className="w-3 h-3" />
                                  <span>{t.absent}</span>
                                </span>
                              )}
                              {status === 'late' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{t.late}</span>
                                </span>
                              )}
                              {status === 'excused' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400">
                                  <UserCheck className="w-3 h-3" />
                                  <span>{t.excused}</span>
                                </span>
                              )}
                              {!status && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {t.notMarked}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-xs">
                              <bdi dir="ltr">{periodLabels(rec?.absencePeriods) || rec?.time || '—'}</bdi>
                            </td>
                            <td data-empty={!rec?.reason && !rec?.notes} className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                              {rec?.reason || rec?.notes || '—'}
                            </td>
                            <td className="py-3 px-4 text-end">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => markAttendance(student.studentId, 'present')}
                                  className={`min-h-8 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    status === 'present'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300'
                                  }`}
                                  title={t.markPresent}
                                  aria-pressed={status === 'present'}
                                >
                                  {t.present}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAbsenceModal(student, 'late')}
                                  className={`min-h-8 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    status === 'late'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-amber-50 hover:text-amber-700 dark:bg-slate-800 dark:hover:bg-amber-950 dark:hover:text-amber-400 text-slate-600 dark:text-slate-300'
                                  }`}
                                  title={t.markLate}
                                  aria-pressed={status === 'late'}
                                >
                                  {t.late}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAbsenceModal(student, 'absent')}
                                  className={`min-h-8 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    status === 'absent'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300'
                                  }`}
                                  title={t.markAbsent}
                                  aria-pressed={status === 'absent'}
                                >
                                  {t.absent}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openAbsenceModal(student, 'excused')}
                                  className={`min-h-8 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    status === 'excused'
                                      ? 'bg-brand-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:hover:bg-brand-950 dark:hover:text-brand-400 text-slate-600 dark:text-slate-300'
                                  }`}
                                  title={t.markExcused}
                                  aria-pressed={status === 'excused'}
                                >
                                  {t.excused}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Attendance Audit Log & Past Records
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chronological list of all recorded attendance updates across dates
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Total Recorded Entries: {attendance.length}
            </span>
          </div>

          {attendance.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title={t.noAttendanceTitle}
              description={t.noAttendanceDesc}
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-start text-xs md:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 text-start">{t.date}</th>
                    <th className="py-3 px-4 text-start">{t.studentId}</th>
                    <th className="py-3 px-4 text-start">{t.status}</th>
                    <th className="py-3 px-4 text-start">{t.time}</th>
                    <th className="py-3 px-4 text-start">{t.reason}</th>
                    <th className="py-3 px-4 text-end">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendance.slice(0, 50).map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {formatDateWithPattern(record.date, settings.dateFormat)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900 dark:text-slate-100">
                        {record.studentId}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            record.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : record.status === 'absent'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : record.status === 'late'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        <bdi dir="ltr">{periodLabels(record.absencePeriods) || record.time || '—'}</bdi>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {record.reason || '—'}
                      </td>
                      <td className="py-3 px-4 text-end">
                        <button
                          type="button"
                          onClick={() => deleteAttendanceRecord(record.id)}
                          className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATTENDANCE REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Class Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                {t.topAbsentClasses}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Absence rates ranked across academic classes today
              </p>

              {classBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-8 text-center">
                  No class data available. Register students first.
                </p>
              ) : (
                <div className="space-y-4">
                  {classBreakdown.map((item) => (
                    <div key={item.className} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.className}
                        </span>
                        <span className="text-slate-500">
                          {item.absent} absent / {item.total} total ({item.absenceRate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, item.absenceRate)}%` }}
                          className={`h-full transition-all ${
                            item.absenceRate > 20 ? 'bg-rose-500' : 'bg-brand-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7-Day Trend Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t.attendanceTrends}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Historical attendance percentage across the past 7 calendar days
                </p>

                <div className="space-y-3">
                  {past7DaysData.map((d) => (
                    <div key={d.date} className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {d.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">
                          {d.present} present, {d.absent} absent
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            d.rate >= 90
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {d.rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Calculated dynamically from real stored records
                </span>
                <button
                  type="button"
                  onClick={handleExportAttendance}
                  className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Full Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AttendanceEmails />

      {/* Absence Form Modal */}
      <AbsenceModal
        isOpen={Boolean(absenceModalStudent)}
        onClose={() => setAbsenceModalStudent(null)}
        student={absenceModalStudent}
        targetDate={currentDate}
        initialStatus={absenceModalStatus}
        initialReason={absenceModalReason}
        initialNotes={absenceModalNotes}
      />
    </div>
  );
};
