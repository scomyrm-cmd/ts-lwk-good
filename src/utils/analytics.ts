import { Student, AttendanceRecord, LostFoundItem, ActivityLogItem, DateFormat } from '../types';

export interface DailyAttendanceStats {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number; // percentage 0-100
}

export interface ClassAttendanceStat {
  className: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  absenceRate: number; // percentage 0-100
}

export interface LostFoundStats {
  totalReported: number;
  lostCount: number;
  foundCount: number;
  claimedCount: number;
  pendingUnclaimed: number;
}

export function calculateDailyAttendance(
  students: Student[],
  attendanceRecords: AttendanceRecord[],
  targetDate: string
): DailyAttendanceStats {
  const totalStudents = students.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
    };
  }

  const recordsForDate = attendanceRecords.filter((r) => r.date === targetDate);
  const recordMap = new Map<string, AttendanceRecord>();
  recordsForDate.forEach((r) => recordMap.set(r.studentId, r));

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  students.forEach((student) => {
    const record = recordMap.get(student.studentId);
    if (!record) {
      // If no explicit record exists yet for today, they aren't marked
      return;
    }
    if (record.status === 'present') present++;
    else if (record.status === 'absent') absent++;
    else if (record.status === 'late') late++;
    else if (record.status === 'excused') excused++;
  });

  const markedTotal = present + absent + late + excused;
  const attendanceRate = markedTotal > 0 ? Math.round(((present + late) / markedTotal) * 100) : 0;

  return {
    totalStudents,
    present,
    absent,
    late,
    excused,
    attendanceRate,
  };
}

export function calculateClassAttendance(
  students: Student[],
  attendanceRecords: AttendanceRecord[],
  targetDate: string
): ClassAttendanceStat[] {
  if (students.length === 0) return [];

  const classMap = new Map<string, Student[]>();
  students.forEach((s) => {
    const list = classMap.get(s.className) || [];
    list.push(s);
    classMap.set(s.className, list);
  });

  const recordsForDate = attendanceRecords.filter((r) => r.date === targetDate);
  const statusMap = new Map<string, string>();
  recordsForDate.forEach((r) => statusMap.set(r.studentId, r.status));

  const results: ClassAttendanceStat[] = [];

  classMap.forEach((classStudents, className) => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    classStudents.forEach((student) => {
      const status = statusMap.get(student.studentId);
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else if (status === 'excused') excused++;
    });

    const total = classStudents.length;
    const marked = present + absent + late + excused;
    const absenceRate = marked > 0 ? Math.round((absent / marked) * 100) : 0;

    results.push({
      className,
      total,
      present,
      absent,
      late,
      excused,
      absenceRate,
    });
  });

  return results.sort((a, b) => b.absenceRate - a.absenceRate);
}

export function calculateLostFoundStats(items: LostFoundItem[]): LostFoundStats {
  const totalReported = items.length;
  let lostCount = 0;
  let foundCount = 0;
  let claimedCount = 0;

  items.forEach((item) => {
    if (item.status === 'claimed') claimedCount++;
    if (item.reportType === 'lost') lostCount++;
    if (item.reportType === 'found') foundCount++;
  });

  const pendingUnclaimed = items.filter(
    (i) => i.status === 'lost' || i.status === 'found'
  ).length;

  return {
    totalReported,
    lostCount,
    foundCount,
    claimedCount,
    pendingUnclaimed,
  };
}

/**
 * Prepares privacy-preserving, anonymized school statistics for Campus AI.
 * Strict zero-PII guarantee: No student names, IDs, guardian numbers, or personal notes are transmitted.
 */
export function buildSanitizedAISchoolContext(
  students: Student[],
  attendance: AttendanceRecord[],
  lostFound: LostFoundItem[],
  activities: ActivityLogItem[],
  currentDate: string
) {
  const todayStats = calculateDailyAttendance(students, attendance, currentDate);
  const classStats = calculateClassAttendance(students, attendance, currentDate);
  const lfStats = calculateLostFoundStats(lostFound);

  // Group students by class counts
  const classesDistribution: Record<string, number> = {};
  students.forEach((s) => {
    classesDistribution[s.className] = (classesDistribution[s.className] || 0) + 1;
  });

  // Category counts for lost and found
  const lostFoundCategories: Record<string, number> = {};
  lostFound.forEach((i) => {
    lostFoundCategories[i.category] = (lostFoundCategories[i.category] || 0) + 1;
  });

  // Recent 7 days attendance summary
  const last7Days: { date: string; present: number; absent: number; late: number; excused: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const stat = calculateDailyAttendance(students, attendance, dateStr);
    last7Days.push({
      date: dateStr,
      present: stat.present,
      absent: stat.absent,
      late: stat.late,
      excused: stat.excused,
    });
  }

  return {
    date: currentDate,
    studentMetrics: {
      totalRegistered: students.length,
      classBreakdown: classesDistribution,
    },
    todayAttendance: todayStats,
    attendanceByClass: classStats.map((c) => ({
      class: c.className,
      students: c.total,
      present: c.present,
      absent: c.absent,
      late: c.late,
      absenceRatePercent: c.absenceRate,
    })),
    last7DaysTrend: last7Days,
    lostAndFoundMetrics: {
      totalReported: lfStats.totalReported,
      lostItems: lfStats.lostCount,
      foundItems: lfStats.foundCount,
      claimedItems: lfStats.claimedCount,
      unclaimedPending: lfStats.pendingUnclaimed,
      categoriesBreakdown: lostFoundCategories,
    },
    activityMetrics: {
      totalLoggedActions: activities.length,
      recentActionsCount: activities.slice(0, 10).length,
    },
  };
}

/**
 * Prepares comprehensive school administration context for Campus AI.
 * Enables the AI assistant to answer any questions about individual students,
 * attendance histories, class rosters, guardian contacts, and school operations.
 */
export function buildComprehensiveAISchoolContext(
  students: Student[],
  attendance: AttendanceRecord[],
  lostFound: LostFoundItem[],
  activities: ActivityLogItem[],
  currentDate: string
) {
  const sanitized = buildSanitizedAISchoolContext(students, attendance, lostFound, activities, currentDate);

  // Group records by student
  const studentRecordsMap = new Map<string, AttendanceRecord[]>();
  attendance.forEach((rec) => {
    const list = studentRecordsMap.get(rec.studentId) || [];
    list.push(rec);
    studentRecordsMap.set(rec.studentId, list);
  });

  // Build detailed student profiles
  const studentProfiles = students.map((s) => {
    const records = studentRecordsMap.get(s.studentId) || [];
    const todayRecord = records.find((r) => r.date === currentDate);
    const absences = records.filter((r) => r.status === 'absent');
    const lates = records.filter((r) => r.status === 'late');
    const excused = records.filter((r) => r.status === 'excused');
    const presents = records.filter((r) => r.status === 'present');
    const totalMarked = presents.length + absences.length + lates.length + excused.length;
    const rate = totalMarked > 0 ? Math.round(((presents.length + lates.length) / totalMarked) * 100) : 100;

    const linkedItems = lostFound.filter((item) => {
      const matchClaim = item.claimedStudentId === s.studentId;
      const matchName = item.reporterName.toLowerCase().includes(s.lastName.toLowerCase()) ||
        item.claimedBy?.toLowerCase().includes(s.lastName.toLowerCase());
      return matchClaim || matchName;
    });

    return {
      studentId: s.studentId,
      fullName: `${s.firstName} ${s.lastName}`,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
      gender: s.gender || 'Unspecified',
      dateOfBirth: s.dateOfBirth || 'Not provided',
      guardianContact: s.guardianContact || 'None on file',
      notes: s.notes || 'No administrative notes',
      todayAttendanceStatus: todayRecord ? todayRecord.status : 'unmarked',
      todayAttendanceNote: todayRecord?.notes || todayRecord?.reason || null,
      totalAbsences: absences.length,
      totalLate: lates.length,
      totalExcused: excused.length,
      totalPresent: presents.length,
      attendanceRatePercent: rate,
      recentAbsences: absences.slice(-5).map((a) => ({
        date: a.date,
        reason: a.reason || 'Unspecified',
        notes: a.notes || '',
      })),
      associatedLostFound: linkedItems.map((i) => ({
        itemName: i.itemName,
        status: i.status,
        type: i.reportType,
        date: i.dateReported,
      })),
    };
  });

  // Filter students absent today
  const todayAbsentees = studentProfiles
    .filter((s) => s.todayAttendanceStatus === 'absent')
    .map((s) => ({
      studentId: s.studentId,
      fullName: s.fullName,
      className: s.className,
      guardianContact: s.guardianContact,
      note: s.todayAttendanceNote,
      cumulativeAbsences: s.totalAbsences,
    }));

  // Filter students late today
  const todayLate = studentProfiles
    .filter((s) => s.todayAttendanceStatus === 'late')
    .map((s) => ({
      studentId: s.studentId,
      fullName: s.fullName,
      className: s.className,
      guardianContact: s.guardianContact,
      note: s.todayAttendanceNote,
    }));

  // Filter students excused today
  const todayExcused = studentProfiles
    .filter((s) => s.todayAttendanceStatus === 'excused')
    .map((s) => ({
      studentId: s.studentId,
      fullName: s.fullName,
      className: s.className,
      guardianContact: s.guardianContact,
      note: s.todayAttendanceNote,
    }));

  // Sort students by highest absences
  const topAbsentees = [...studentProfiles]
    .filter((s) => s.totalAbsences > 0)
    .sort((a, b) => b.totalAbsences - a.totalAbsences)
    .slice(0, 10)
    .map((s) => ({
      studentId: s.studentId,
      fullName: s.fullName,
      className: s.className,
      totalAbsences: s.totalAbsences,
      attendanceRate: `${s.attendanceRatePercent}%`,
      guardianContact: s.guardianContact,
    }));

  // Rosters by class
  const rostersByClass: Record<string, Array<{ studentId: string; fullName: string; todayStatus: string }>> = {};
  studentProfiles.forEach((s) => {
    if (!rostersByClass[s.className]) rostersByClass[s.className] = [];
    rostersByClass[s.className].push({
      studentId: s.studentId,
      fullName: s.fullName,
      todayStatus: s.todayAttendanceStatus,
    });
  });

  // Recent lost and found items
  const recentLostFound = lostFound.slice(0, 15).map((i) => ({
    id: i.id,
    itemName: i.itemName,
    category: i.category,
    status: i.status,
    reportType: i.reportType,
    dateReported: i.dateReported,
    location: i.location,
    reporterName: i.reporterName,
    claimedBy: i.claimedBy || null,
  }));

  return {
    ...sanitized,
    students: studentProfiles,
    todayAbsentees,
    todayLate,
    todayExcused,
    topAbsentees,
    rostersByClass,
    lostAndFoundList: recentLostFound,
  };
}

export function formatDateWithPattern(dateStr: string, format: DateFormat): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;

  switch (format) {
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;
    case 'YYYY-MM-DD':
    default:
      return dateStr;
  }
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
