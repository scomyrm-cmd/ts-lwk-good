import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { exportToCSV, formatDateWithPattern } from '../../utils/analytics';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { StudentModal } from './StudentModal';
import { StudentProfileModal } from './StudentProfileModal';

export const StudentsView: React.FC = () => {
  const {
    students,
    attendance,
    currentDate,
    deleteStudent,
    openAIChat,
    exportStudentsToExcel,
    settings,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToView, setStudentToView] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Extract unique classes
  const classes = Array.from(new Set(students.map((s) => s.className))).sort();

  // Map today's attendance for each student
  const todayRecords = attendance.filter((a) => a.date === currentDate);
  const attendanceMap = new Map<string, string>();
  todayRecords.forEach((r) => attendanceMap.set(r.studentId, r.status));

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === '' ||
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === 'all' || student.className === selectedClass;

    const studentStatus = attendanceMap.get(student.studentId) || 'unmarked';
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'unmarked' && studentStatus === 'unmarked') ||
      studentStatus === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleExportCsv = () => {
    const headers = ['Student ID', 'First Name', 'LastName', 'Class', 'Gender', 'Date of Birth', 'Guardian Contact', 'Status Today'];
    const rows = filteredStudents.map((s) => [
      s.studentId,
      s.firstName,
      s.lastName,
      s.className,
      s.gender || '',
      s.dateOfBirth ? formatDateWithPattern(s.dateOfBirth, settings.dateFormat) : '',
      s.guardianContact || '',
      attendanceMap.get(s.studentId) || 'Unmarked',
    ]);
    exportToCSV(`students_list_${currentDate}`, headers, rows);
  };

  const getInitials = (first: string, last: string) => {
    return ((first[0] || '') + (last[0] || '')).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.studentsTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t.studentsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {students.length > 0 && (
            <>
              <button
                type="button"
                data-testid="export-excel-btn"
                onClick={() => setIsExportConfirmOpen(true)}
                disabled={isExportingExcel}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{isExportingExcel ? t.exportingExcel : t.exportExcel}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t.exportCsv}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setStudentToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addStudent}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t.noStudentsTitle}
          description={t.noStudentsDesc}
          actionButton={{
            label: t.registerFirstStudent,
            onClick: () => {
              setStudentToEdit(null);
              setIsAddModalOpen(true);
            },
            icon: Plus,
          }}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Controls Bar: Search & Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, student ID, class..."
                className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Attendance Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Attendance</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
                <option value="unmarked">Unmarked</option>
              </select>

              <span className="text-xs text-slate-400 px-1">
                {filteredStudents.length} of {students.length} students
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs md:text-sm">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{t.studentId}</th>
                  <th className="py-3 px-4 text-start">{t.fullName}</th>
                  <th className="py-3 px-4 text-start">{t.className}</th>
                  <th className="py-3 px-4 text-start">{t.gender}</th>
                  <th className="py-3 px-4 text-start">{t.guardianContact}</th>
                  <th className="py-3 px-4 text-start">{t.attendanceStatus}</th>
                  <th className="py-3 px-4 text-end">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-xs text-slate-400">
                      No students found matching your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const status = attendanceMap.get(student.studentId);
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {student.studentId}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setStudentToView(student)}
                            className="flex items-center gap-3 text-start group cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(student.firstName, student.lastName)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block transition-colors">
                                {student.firstName} {student.lastName}
                              </span>
                            </div>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                          {student.className}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {student.gender || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {student.guardianContact || '—'}
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
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                              <UserCheck className="w-3 h-3" />
                              <span>{t.excused}</span>
                            </span>
                          )}
                          {!status && (
                            <span className="text-[11px] text-slate-400 italic">
                              Unmarked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-end relative">
                          <div className="inline-block text-start">
                            <button
                              type="button"
                              onClick={() =>
                                setActionMenuOpenId(
                                  actionMenuOpenId === student.id ? null : student.id
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              aria-label="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {actionMenuOpenId === student.id && (
                              <div
                                className="absolute end-4 mt-1 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-100"
                                onMouseLeave={() => setActionMenuOpenId(null)}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuOpenId(null);
                                    setStudentToView(student);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{t.viewProfile}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuOpenId(null);
                                    setStudentToEdit(student);
                                    setIsAddModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>{t.editStudent}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuOpenId(null);
                                    openAIChat(`Tell me everything about student ${student.firstName} ${student.lastName} (${student.studentId}), including attendance record and guardian contact.`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer font-medium"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Ask Campus AI</span>
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuOpenId(null);
                                    setStudentToDelete(student);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t.deleteStudent}</span>
                                </button>
                              </div>
                            )}
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

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setStudentToEdit(null);
        }}
        studentToEdit={studentToEdit}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={Boolean(studentToView)}
        onClose={() => setStudentToView(null)}
        student={studentToView}
        onEdit={(st) => {
          setStudentToEdit(st);
          setIsAddModalOpen(true);
        }}
      />

      {/* Excel Export Confirmation Modal */}
      <ConfirmModal
        isOpen={isExportConfirmOpen}
        title={t.exportConfirmTitle}
        message={`${t.exportConfirmDesc} (${filteredStudents.length} records selected)`}
        confirmLabel={t.exportExcel}
        isDestructive={false}
        onConfirm={async () => {
          setIsExportingExcel(true);
          try {
            await exportStudentsToExcel(selectedClass, selectedStatus);
          } finally {
            setIsExportingExcel(false);
            setIsExportConfirmOpen(false);
          }
        }}
        onCancel={() => setIsExportConfirmOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(studentToDelete)}
        title={t.deleteStudent}
        message={t.confirmDeleteStudent}
        confirmLabel={t.delete}
        isDestructive={true}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }
        }}
        onCancel={() => setStudentToDelete(null)}
      />
    </div>
  );
};
