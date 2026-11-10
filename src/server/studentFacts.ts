import type { AttendanceRecord, Student } from '../types/index.js';

export function indexAttendance(attendance: AttendanceRecord[]) {
  const byStudent = new Map<string, Map<string, AttendanceRecord>>();
  for (const record of attendance) {
    const days = byStudent.get(record.studentId) ?? new Map<string, AttendanceRecord>();
    const previous = days.get(record.date);
    if (!previous || record.updatedAt > previous.updatedAt) days.set(record.date, record);
    byStudent.set(record.studentId, days);
  }
  return byStudent;
}

export function attendanceFacts(records: Iterable<AttendanceRecord>, today: string) {
  const rows = Array.from(records).sort((a, b) => b.date.localeCompare(a.date));
  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const row of rows) {
    if (Object.hasOwn(counts, row.status)) counts[row.status]++;
  }
  const marked = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const recent = rows.slice(0, 8).map(({ date, status }) => ({ date, status }));
  return {
    ...counts,
    marked,
    rate: marked ? Math.round(100 * (counts.present + counts.late) / marked) : null,
    today: rows.find((row) => row.date === today)?.status ?? 'unmarked',
    latestAbsences: rows.filter((row) => row.status === 'absent').slice(0, 5).map(({ date }) => date),
    recent,
  };
}

export function studentLabel(student: Student) {
  return [student.firstName, student.lastName].filter(Boolean).join(' ');
}
