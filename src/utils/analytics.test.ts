import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyAttendance,
  calculateClassAttendance,
  calculateLostFoundStats,
  buildSanitizedAISchoolContext,
  buildComprehensiveAISchoolContext,
  formatDateWithPattern,
} from './analytics.ts';
import { Student, AttendanceRecord, LostFoundItem, ActivityLogItem } from '../types/index.ts';

test('calculateDailyAttendance returns 0s on empty data', () => {
  const result = calculateDailyAttendance([], [], '2026-11-03');
  assert.equal(result.totalStudents, 0);
  assert.equal(result.present, 0);
  assert.equal(result.absent, 0);
  assert.equal(result.attendanceRate, 0);
});

test('calculateDailyAttendance accurately calculates breakdown and rate', () => {
  const students: Student[] = [
    { id: '1', studentId: 'S01', firstName: 'John', lastName: 'Doe', className: '10-A', createdAt: '' },
    { id: '2', studentId: 'S02', firstName: 'Jane', lastName: 'Smith', className: '10-A', createdAt: '' },
    { id: '3', studentId: 'S03', firstName: 'Adam', lastName: 'Lee', className: '10-B', createdAt: '' },
  ];

  const records: AttendanceRecord[] = [
    { id: 'r1', studentId: 'S01', date: '2026-11-03', status: 'present', updatedAt: '' },
    { id: 'r2', studentId: 'S02', date: '2026-11-03', status: 'absent', updatedAt: '' },
    { id: 'r3', studentId: 'S03', date: '2026-11-03', status: 'late', updatedAt: '' },
  ];

  const result = calculateDailyAttendance(students, records, '2026-11-03');
  assert.equal(result.totalStudents, 3);
  assert.equal(result.present, 1);
  assert.equal(result.absent, 1);
  assert.equal(result.late, 1);
  assert.equal(result.excused, 0);
  // (present + late) / 3 = 2/3 ≈ 67%
  assert.equal(result.attendanceRate, 67);
});

test('calculateClassAttendance ranks classes by absence rate', () => {
  const students: Student[] = [
    { id: '1', studentId: 'S01', firstName: 'A', lastName: 'A', className: '10-A', createdAt: '' },
    { id: '2', studentId: 'S02', firstName: 'B', lastName: 'B', className: '10-B', createdAt: '' },
  ];
  const records: AttendanceRecord[] = [
    { id: 'r1', studentId: 'S01', date: '2026-11-03', status: 'present', updatedAt: '' },
    { id: 'r2', studentId: 'S02', date: '2026-11-03', status: 'absent', updatedAt: '' },
  ];

  const result = calculateClassAttendance(students, records, '2026-11-03');
  assert.equal(result.length, 2);
  assert.equal(result[0].className, '10-B'); // higher absence rate (100%)
  assert.equal(result[0].absenceRate, 100);
  assert.equal(result[1].className, '10-A');
  assert.equal(result[1].absenceRate, 0);
});

test('calculateLostFoundStats tracks status counts correctly', () => {
  const items: LostFoundItem[] = [
    { id: '1', itemName: 'Book', category: 'Books', description: '', reportType: 'lost', dateReported: '', location: '', reporterName: '', status: 'lost', createdAt: '' },
    { id: '2', itemName: 'Bag', category: 'Bags', description: '', reportType: 'found', dateReported: '', location: '', reporterName: '', status: 'found', createdAt: '' },
    { id: '3', itemName: 'Keys', category: 'Other', description: '', reportType: 'found', dateReported: '', location: '', reporterName: '', status: 'claimed', createdAt: '' },
  ];

  const stats = calculateLostFoundStats(items);
  assert.equal(stats.totalReported, 3);
  assert.equal(stats.lostCount, 1);
  assert.equal(stats.foundCount, 2);
  assert.equal(stats.claimedCount, 1);
  assert.equal(stats.pendingUnclaimed, 2);
});

test('buildSanitizedAISchoolContext ensures zero PII transmission', () => {
  const students: Student[] = [
    {
      id: '1',
      studentId: 'SECRET-STU-001',
      firstName: 'SensitiveName',
      lastName: 'PrivateFamily',
      className: 'Grade 11',
      guardianContact: '+212600000000',
      notes: 'Confidential medical allergy',
      createdAt: '',
    },
  ];

  const records: AttendanceRecord[] = [
    { id: 'r1', studentId: 'SECRET-STU-001', date: '2026-11-03', status: 'present', updatedAt: '' },
  ];

  const context = buildSanitizedAISchoolContext(students, records, [], [], '2026-11-03');
  const serialized = JSON.stringify(context);

  // Verification: student name, id, guardian contact, and notes are NOT in the payload
  assert.equal(serialized.includes('SECRET-STU-001'), false);
  assert.equal(serialized.includes('SensitiveName'), false);
  assert.equal(serialized.includes('PrivateFamily'), false);
  assert.equal(serialized.includes('+212600000000'), false);
  assert.equal(serialized.includes('Confidential medical allergy'), false);

  assert.equal(context.studentMetrics.totalRegistered, 1);
  assert.equal(context.studentMetrics.classBreakdown['Grade 11'], 1);
});

test('buildComprehensiveAISchoolContext builds student intelligence profile and absentees', () => {
  const students: Student[] = [
    {
      id: '1',
      studentId: 'STU-1001',
      firstName: 'Marcus',
      lastName: 'Vance',
      className: 'Grade 10-A',
      guardianContact: '+1-555-0101',
      notes: 'Asthma inhaler in nurse office',
      createdAt: '2026-09-01',
    },
  ];

  const records: AttendanceRecord[] = [
    { id: 'r1', studentId: 'STU-1001', date: '2026-11-03', status: 'absent', reason: 'Flu symptoms', notes: 'Parent called', updatedAt: '' },
  ];

  const context = buildComprehensiveAISchoolContext(students, records, [], [], '2026-11-03');

  assert.equal(context.students.length, 1);
  assert.equal(context.students[0].fullName, 'Marcus Vance');
  assert.equal(context.students[0].guardianContact, '+1-555-0101');
  assert.equal(context.students[0].todayAttendanceStatus, 'absent');
  assert.equal(context.students[0].totalAbsences, 1);

  assert.equal(context.todayAbsentees.length, 1);
  assert.equal(context.todayAbsentees[0].fullName, 'Marcus Vance');
  assert.equal(context.todayAbsentees[0].guardianContact, '+1-555-0101');
});

test('formatDateWithPattern handles DD/MM/YYYY and MM/DD/YYYY', () => {
  assert.equal(formatDateWithPattern('2026-11-03', 'DD/MM/YYYY'), '03/11/2026');
  assert.equal(formatDateWithPattern('2026-11-03', 'MM/DD/YYYY'), '11/03/2026');
  assert.equal(formatDateWithPattern('2026-11-03', 'YYYY-MM-DD'), '2026-11-03');
});
