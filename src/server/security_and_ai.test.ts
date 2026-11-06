import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectLanguage,
  generateLocalSchoolResponseMultilingual,
} from './aiMultilingual.js';
import { sanitizeInput, generateToken, verifyPassword } from './auth.js';
import { sanitizeExcelCell } from './excelExport.js';
import { db } from './db.js';
import bcrypt from 'bcryptjs';

// 1. Language Detection & Moroccan Darija Support
test('detectLanguage correctly detects English, French, Arabic, and Moroccan Darija', () => {
  // English
  assert.equal(detectLanguage('Who is absent today?'), 'en');
  assert.equal(detectLanguage('Tell me about Marcus Vance'), 'en');

  // French
  assert.equal(detectLanguage('Qui est absent aujourd\'hui ?'), 'fr');
  assert.equal(detectLanguage('Bonjour, donnez-moi la liste des élèves'), 'fr');

  // Modern Standard Arabic (Fusha)
  assert.equal(detectLanguage('من هم الطلاب الغائبون اليوم في المؤسسة؟'), 'ar');
  assert.equal(detectLanguage('أريد معلومات عن التلميذ'), 'ar');

  // Moroccan Arabic (Darija)
  assert.equal(detectLanguage('شكون لي غايب اليوم فـ القسم؟'), 'darija');
  assert.equal(detectLanguage('واش كاين شي تلميذ سميتو يوسف؟'), 'darija');
  assert.equal(detectLanguage('عطيني نمرة ديال والديه عفاك'), 'darija');
  assert.equal(detectLanguage('chkon li ghayeb lyoum?'), 'darija');
  assert.equal(detectLanguage('wach kayn chi tlemid?'), 'darija');
});

// 2. Multilingual AI School Intelligence Responses
test('generateLocalSchoolResponseMultilingual handles Darija queries for absentees', () => {
  const stats = {
    date: '2026-11-05',
    students: [
      {
        studentId: 'STU-1001',
        fullName: 'Youssef Benali',
        className: 'Grade 10-A',
        todayAttendanceStatus: 'absent',
        attendanceRatePercent: 92,
        totalAbsences: 2,
        guardianContact: '+212 661-223344',
      },
    ],
    todayAbsentees: [
      {
        studentId: 'STU-1001',
        fullName: 'Youssef Benali',
        className: 'Grade 10-A',
        guardianContact: '+212 661-223344',
        note: 'Illness',
        cumulativeAbsences: 2,
      },
    ],
  };

  const darijaResponse = generateLocalSchoolResponseMultilingual('شكون لي غايب اليوم؟', stats);
  // Verify Darija response includes student name, guardian phone, and Arabic title
  assert.equal(darijaResponse.includes('Youssef Benali'), true);
  assert.equal(darijaResponse.includes('+212 661-223344'), true);
  assert.equal(darijaResponse.includes('لائحة التلاميذ الغائبين اليوم'), true);
});

test('generateLocalSchoolResponseMultilingual handles French queries', () => {
  const stats = {
    date: '2026-11-05',
    students: [
      {
        studentId: 'STU-1002',
        fullName: 'Sara El Idrissi',
        className: 'Grade 11-B',
        todayAttendanceStatus: 'present',
        attendanceRatePercent: 98,
        totalAbsences: 0,
        guardianContact: '+212 662-334455',
      },
    ],
    todayAbsentees: [],
  };

  const frResponse = generateLocalSchoolResponseMultilingual('Qui est absent aujourd\'hui ?', stats);
  assert.equal(frResponse.includes('Registre des absences'), true);
});

// 3. XSS Protection & Sanitization
test('sanitizeInput properly escapes malicious HTML and script tags', () => {
  const malicious = '<script>alert("XSS")</script>';
  const sanitized = sanitizeInput(malicious);
  assert.equal(sanitized.includes('<script>'), false);
  assert.equal(sanitized, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');

  const nested = {
    name: '<b>Normal User</b>',
    note: '<img src=x onerror=alert(1)>',
  };
  const cleanNested = sanitizeInput(nested);
  assert.equal(cleanNested.name, '&lt;b&gt;Normal User&lt;/b&gt;');
  assert.equal(cleanNested.note.includes('<img'), false);
});

// 4. Excel Formula Injection Protection
test('sanitizeExcelCell escapes formula prefixes (=, +, -, @, \\t, \\r)', () => {
  assert.equal(sanitizeExcelCell('=SUM(A1:A10)'), "'=SUM(A1:A10)");
  assert.equal(sanitizeExcelCell('+cmd|/c calc'), "'+cmd|/c calc");
  assert.equal(sanitizeExcelCell('-10+20'), "'-10+20");
  assert.equal(sanitizeExcelCell('@IMPORT("http://malicious.com")'), "'@IMPORT(\"http://malicious.com\")");
  assert.equal(sanitizeExcelCell('\tformula'), "'\tformula");

  // Harmless text and numbers should not be modified
  assert.equal(sanitizeExcelCell('Marcus Vance'), 'Marcus Vance');
  assert.equal(sanitizeExcelCell(98), 98);
});

// 5. Authentication, Bcrypt Hashing & Role Control
test('password hashing and verification work securely with bcrypt', () => {
  const plain = 'securePassword123!';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(plain, salt);

  assert.equal(verifyPassword(plain, hash), true);
  assert.equal(verifyPassword('wrongPassword', hash), false);
});

test('db.createUser enforces normal user role on registration', () => {
  const testUser = db.createUser({
    username: 'test_student_' + Date.now(),
    email: `test_${Date.now()}@campus-os.edu`,
    password: 'password123',
    displayName: 'Test Student',
  });

  assert.equal(testUser.role, 'user');
  assert.equal(testUser.passwordHash.startsWith('$2'), true); // Valid bcrypt hash
});
