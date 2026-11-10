import React from 'react';
import { X, Printer, Download, Sparkles, School, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateDailyAttendance, calculateLostFoundStats, formatDateWithPattern } from '../../utils/analytics';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'daily' | 'weekly' | 'monthly' | 'lostfound';
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
}) => {
  const { students, attendance, lostFoundItems, schoolInfo, currentDate, settings } = useApp();

  if (!isOpen) return null;

  const dailyStats = calculateDailyAttendance(students, attendance, currentDate);
  const lfStats = calculateLostFoundStats(lostFoundItems);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = formatDateWithPattern(currentDate, settings.dateFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Controls (Not printed) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Campus AI Generated Administrative Report
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900" id="printable-report">
          {/* Institutional Header */}
          <div className="border-b pb-6 border-slate-200 dark:border-slate-800 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-brand-600 dark:text-brand-400">
                {schoolInfo.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {schoolInfo.address}, {schoolInfo.city}, {schoolInfo.country}
              </p>
              <p className="text-xs text-slate-500">
                Email: {schoolInfo.email} · Phone: {schoolInfo.phone}
              </p>
            </div>
            <div className="text-end">
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded font-semibold text-slate-700 dark:text-slate-300">
                DOC-REF #{Date.now().toString().slice(-6)}
              </span>
              <p className="text-xs text-slate-400 mt-1">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Report Title */}
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Executive School Administration & Attendance Report
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compiled autonomously by Campus AI based on live authenticated school registers.
            </p>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              1. Executive Summary
            </h3>
            <p>
              As of {formattedDate}, the institution has a total enrolled registry of{' '}
              <strong>{dailyStats.totalStudents} students</strong>. Today's overall attendance rate stands at{' '}
              <strong>{dailyStats.attendanceRate}%</strong>, with {dailyStats.present} students verified present,{' '}
              {dailyStats.absent} recorded absent, and {dailyStats.late} arrivals logged late. In the campus inventory,{' '}
              {lfStats.pendingUnclaimed} items remain unclaimed in the Lost & Found depository.
            </p>
          </div>

          {/* Section 2: Key Measured Metrics */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-xs text-slate-500">
              2. Key Measured Performance Indicators
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 border rounded-xl border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Registry</span>
                <span className="text-lg font-bold">{dailyStats.totalStudents}</span>
              </div>
              <div className="p-3 border rounded-xl border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Presence Today</span>
                <span className="text-lg font-bold text-emerald-600">{dailyStats.present}</span>
              </div>
              <div className="p-3 border rounded-xl border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Absences Today</span>
                <span className="text-lg font-bold text-rose-600">{dailyStats.absent}</span>
              </div>
              <div className="p-3 border rounded-xl border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Attendance Rate</span>
                <span className="text-lg font-bold text-brand-600">{dailyStats.attendanceRate}%</span>
              </div>
            </div>
          </div>

          {/* Section 3: Lost & Found Status */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-xs text-slate-500">
              3. Custody & Lost Property Overview
            </h3>
            <div className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p>• Total Historical Items Logged: <strong>{lfStats.totalReported}</strong></p>
              <p>• Unclaimed Items Currently in Safekeeping: <strong>{lfStats.pendingUnclaimed}</strong></p>
              <p>• Verified Items Successfully Claimed: <strong>{lfStats.claimedCount}</strong></p>
            </div>
          </div>

          {/* Section 4: Administrative Observations */}
          <div className="space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-xs text-slate-500">
              4. Assistant Recommendations
            </h3>
            <ul className="text-xs list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Regular verification of student contact details to streamline rapid parent absence notifications.</li>
              <li>Schedule periodic notifications to students regarding items available in the Lost & Found office.</li>
              <li>Monitor late arrival patterns to identify recurring transport issues for specific cohorts.</li>
            </ul>
          </div>

          {/* Institutional Stamp & Signatures */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">Campus OS Automated Archive</p>
              <p>Confidential School Administration Record</p>
            </div>
            <div className="text-end">
              <div className="w-32 border-b border-slate-300 dark:border-slate-700 mb-1" />
              <p>Authorized Administrator Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
