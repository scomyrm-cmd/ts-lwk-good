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
  CloudUpload,
  RefreshCw,
  Check,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkspaceHeader } from '../common/WorkspaceUI';
import { Student } from '../../types';
import { exportToCSV, formatDateWithPattern } from '../../utils/analytics';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { StudentModal } from './StudentModal';
import { StudentProfileModal } from './StudentProfileModal';
import { studentContact } from '../../utils/studentContact';

export const StudentsView: React.FC = () => {
  const {
    students,
    attendance,
    currentDate,
    deleteStudent,
    openAIChat,
    exportStudentsToExcel,
    isSavingStudents,
    lastSavedStudentsAt,
    saveStudentsToServer,
    addStudent,
    showToast,
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
    const headers = ['Student ID', 'First Name', 'LastName', 'Class', 'Gender', 'Date of Birth', 'Guardian Contact', 'Status Today', 'Guardian Email', 'Guardian Phone'];
    const rows = filteredStudents.map((s) => [
      s.studentId,
      s.firstName,
      s.lastName,
      s.className,
      s.gender || '',
      s.dateOfBirth ? formatDateWithPattern(s.dateOfBirth, settings.dateFormat) : '',
      s.guardianContact || '',
      attendanceMap.get(s.studentId) || 'Unmarked',
      studentContact(s).email,
      studentContact(s).phone,
    ]);
    exportToCSV(`students_list_${currentDate}`, headers, rows);
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        let importedCount = 0;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : (parsed.students || []);
          if (Array.isArray(list)) {
            list.forEach((s: any) => {
              if (s.firstName && s.lastName) {
                addStudent({
                  studentId: s.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
                  firstName: s.firstName,
                  lastName: s.lastName,
                  className: s.className || 'Grade 10-A',
                  gender: ['Male', 'Female', 'Other'].includes(s.gender) ? s.gender : 'Other',
                  dateOfBirth: s.dateOfBirth || '',
                  guardianContact: s.guardianContact || '',
                  guardianEmail: s.guardianEmail,
                  guardianPhone: s.guardianPhone,
                  notes: s.notes || 'Imported via file',
                });
                importedCount++;
              }
            });
          }
        } else {
          // CSV parser
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
              if (cols.length >= 2) {
                const [studentId, firstName, lastName, className, gender, dateOfBirth, guardianContact] = cols;
                if (firstName && lastName) {
                  addStudent({
                    studentId: studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
                    firstName,
                    lastName,
                    className: className || 'Grade 10-A',
                    gender: (gender?.toLowerCase() as any) || 'other',
                    dateOfBirth: dateOfBirth || '',
                    guardianContact: guardianContact || '',
                    guardianEmail: cols[8] || undefined,
                    guardianPhone: cols[9] || undefined,
                    notes: 'Imported via CSV',
                  });
                  importedCount++;
                }
              }
            }
          }
        }

        if (importedCount > 0) {
          showToast(`Successfully imported ${importedCount} student records. Click 'Save to Server' to sync.`);
        } else {
          showToast('No valid student records found in file.');
        }
      } catch (err: any) {
        showToast(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getInitials = (first: string, last: string) => {
    return ((first[0] || '') + (last[0] || '')).toUpperCase();
  };

  return (
    <div className="workspace-page">
      {/* Hidden file input for importing student records */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      <WorkspaceHeader title={t.studentsTitle} description={t.studentsSubtitle}>
        <button
          type="button"
          onClick={() => {
            setStudentToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="workspace-button workspace-button-primary"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addStudent}</span>
        </button>
      </WorkspaceHeader>

      <div className="workspace-panel flex flex-wrap items-center gap-2 p-3">
        <button
          type="button"
          data-testid="save-students-server-btn"
          onClick={() => saveStudentsToServer()}
          disabled={isSavingStudents}
          title={lastSavedStudentsAt ? `Last saved to server: ${new Date(lastSavedStudentsAt).toLocaleTimeString()}` : 'Save student registry to server database'}
          className="workspace-button"
        >
          {isSavingStudents ? (
            <RefreshCw className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-spin" />
          ) : (
            <CloudUpload className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          )}
          <span>{isSavingStudents ? t.savingToServer : t.saveToServer}</span>
          {lastSavedStudentsAt && !isSavingStudents && (
            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/80 dark:text-brand-200">
              <Check className="w-2.5 h-2.5 mr-0.5" />
              {t.serverSavedBadge}
            </span>
          )}
        </button>

        <button
          type="button"
          data-testid="import-students-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Import student records from a CSV or JSON file"
          className="workspace-button"
        >
          <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <span>Import File</span>
        </button>

        {students.length > 0 && (
          <>
            <button
              type="button"
              data-testid="export-excel-btn"
              onClick={() => setIsExportConfirmOpen(true)}
              disabled={isExportingExcel}
              className="workspace-button"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isExportingExcel ? t.exportingExcel : t.exportExcel}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="workspace-button"
            >
              <Download className="w-4 h-4" />
              <span>{t.exportCsv}</span>
            </button>
          </>
        )}
      </div>

      {/* Main Content Area */}
      {students.length === 0 ? (
        <div className="workspace-panel">
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
        </div>
      ) : (
        <div className="workspace-panel overflow-hidden">
          {/* Controls Bar: Search & Filters */}
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-3 dark:border-slate-800 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, student ID, class..."
                className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
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
              </div>

              {/* Attendance Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{t.studentId}</th>
                  <th className="py-3 px-4 text-start">{t.fullName}</th>
                  <th className="py-3 px-4 text-start">{t.className}</th>
                  <th className="py-3 px-4 text-start">{t.gender}</th>
                  <th className="py-3 px-4 text-start">{t.guardianEmail}</th>
                  <th className="py-3 px-4 text-start">{t.guardianPhone}</th>
                  <th className="py-3 px-4 text-start">{t.attendanceStatus}</th>
                  <th className="py-3 px-4 text-end">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-xs text-slate-400">
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
                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(student.firstName, student.lastName)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 block transition-colors">
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
                          {studentContact(student).email || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm">{studentContact(student).phone || '—'}</td>
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
                                    openAIChat(`Summarize the attendance and school record for student ${student.firstName} ${student.lastName} (${student.studentId}).`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 cursor-pointer font-medium"
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
            const result = await exportStudentsToExcel(selectedClass, selectedStatus);
            if (!result.success) showToast(result.error || 'Student export failed.');
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
