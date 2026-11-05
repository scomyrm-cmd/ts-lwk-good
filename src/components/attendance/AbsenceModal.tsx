import React, { useState, useEffect } from 'react';
import { X, CalendarCheck, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, AttendanceStatus } from '../../types';

interface AbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  targetDate: string;
  initialStatus?: AttendanceStatus;
  initialReason?: string;
  initialNotes?: string;
}

export const AbsenceModal: React.FC<AbsenceModalProps> = ({
  isOpen,
  onClose,
  student,
  targetDate,
  initialStatus = 'absent',
  initialReason = '',
  initialNotes = '',
}) => {
  const { markAttendance, t } = useApp();

  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [reason, setReason] = useState(initialReason);
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setStatus(initialStatus);
    setReason(initialReason);
    setNotes(initialNotes);
  }, [initialStatus, initialReason, initialNotes, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markAttendance(student.studentId, status, reason, notes, targetDate);
    onClose();
  };

  const presetReasons = [
    'Medical / Illness',
    'Dentist / Doctor Appointment',
    'Family Emergency',
    'Public Transport / Traffic Delay',
    'Official School Competition',
    'Authorized Leave',
    'Unexplained Absence',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Record Absence / Delay
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {student.firstName} {student.lastName} ({student.studentId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Attendance Status Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['absent', 'late', 'excused'] as AttendanceStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize border transition-all cursor-pointer ${
                    status === st
                      ? st === 'absent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : st === 'late'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t[st as keyof typeof t] || st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Absence Reason
            </label>
            <select
              value={presetReasons.includes(reason) ? reason : 'Custom'}
              onChange={(e) => {
                if (e.target.value === 'Custom') {
                  setReason('');
                } else {
                  setReason(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="">Select a standard reason...</option>
              {presetReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Custom">Other (Type custom reason below)</option>
            </select>

            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Flu symptoms, transport breakdown..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Official Justification / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Certificate reference number, parent phone call details, etc."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs md:text-sm rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
