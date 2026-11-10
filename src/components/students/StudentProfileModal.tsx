import React from 'react';
import {
  X,
  Edit,
  GraduationCap,
  Calendar,
  Phone,
  FileText,
  UserCheck,
  UserX,
  Clock,
  PackageSearch,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkspaceDialog } from '../common/WorkspaceDialog';
import { Student } from '../../types';
import { formatDateWithPattern } from '../../utils/analytics';
import { studentContact } from '../../utils/studentContact';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
}) => {
  const { attendance, lostFoundItems, settings, openAIChat, t } = useApp();

  if (!isOpen || !student) return null;

  // Filter attendance records for this student
  const studentAttendance = attendance.filter((a) => a.studentId === student.studentId);
  const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
  const absentCount = studentAttendance.filter((a) => a.status === 'absent').length;
  const lateCount = studentAttendance.filter((a) => a.status === 'late').length;
  const excusedCount = studentAttendance.filter((a) => a.status === 'excused').length;
  const totalCount = studentAttendance.length;

  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 100;

  // Associated lost and found
  const linkedItems = lostFoundItems.filter(
    (i) =>
      i.claimedStudentId === student.studentId ||
      i.reporterName.toLowerCase().includes(student.lastName.toLowerCase())
  );

  const getInitials = (first: string, last: string) => {
    return ((first[0] || '') + (last[0] || '')).toUpperCase();
  };

  return (
    <WorkspaceDialog label={t.viewProfile} onClose={onClose} className="max-w-2xl">
      <div className="workspace-panel max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {getInitials(student.firstName, student.lastName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {student.firstName} {student.lastName}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 font-semibold">
                  {student.studentId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {student.className} · {student.gender || 'Student'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                openAIChat(`Summarize the attendance and school record for student ${student.firstName} ${student.lastName} (${student.studentId}).`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Ask Campus AI about this student"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Ask AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={t.editStudent}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Class / Grade
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {student.className}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t.dateOfBirth}
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {student.dateOfBirth
                  ? formatDateWithPattern(student.dateOfBirth, settings.dateFormat)
                  : 'Not specified'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t.guardianPhone}
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block truncate">
                {studentContact(student).phone || '—'}
              </span>
            </div>
          </div>

          {/* Attendance Stats Overview */}
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <p className="auth-label">{t.guardianEmail}</p>
            <p className="break-all text-sm">{studentContact(student).email || '—'}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Attendance History Summary</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {t.present}
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {presentCount}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                  {t.absent}
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {absentCount}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  {t.late}
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {lateCount}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30">
                <span className="text-xs text-brand-700 dark:text-brand-400 font-medium">
                  Presence Rate
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {attendanceRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Recent Absences Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Absence & Late Log</span>
            </h4>
            {studentAttendance.filter((a) => a.status !== 'present').length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                No recorded absences or delays for this student. Perfect record!
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {studentAttendance
                  .filter((a) => a.status !== 'present')
                  .slice(0, 5)
                  .map((rec) => (
                    <div key={rec.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatDateWithPattern(rec.date, settings.dateFormat)}
                        </span>
                        {rec.reason && (
                          <span className="text-slate-500 dark:text-slate-400 ms-2">
                            — {rec.reason}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-medium uppercase text-[10px] ${
                          rec.status === 'absent'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : rec.status === 'late'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Linked Lost & Found items */}
          {linkedItems.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <PackageSearch className="w-4 h-4" />
                <span>Associated Lost & Found Items</span>
              </h4>
              <div className="space-y-2">
                {linkedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.itemName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.category} · {item.location}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Claimed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {student.notes && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Additional Notes
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {student.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </WorkspaceDialog>
  );
};
