import type { Student } from '../types/index.js';

export function isEmailAddress(value: string) {
  return value.length <= 160 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

export function studentContact(student: Pick<Student, 'guardianContact' | 'guardianEmail' | 'guardianPhone'>) {
  const legacy = student.guardianContact || '';
  const emails = [...new Set(legacy.match(/[a-z\d.!#$%&'*+/=?^_`{|}~-]+@[a-z\d.-]+\.[a-z]{2,}/gi) || [])];
  const withoutEmails = legacy.replace(/[a-z\d.!#$%&'*+/=?^_`{|}~-]+@[a-z\d.-]+\.[a-z]{2,}/gi, '');
  return {
    email: (student.guardianEmail ?? (emails.length === 1 ? emails[0] : '')).trim(),
    phone: (student.guardianPhone ?? withoutEmails.match(/\+?\d[\d\s().-]{5,}\d/)?.[0] ?? '').trim(),
  };
}
