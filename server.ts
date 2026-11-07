import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { GoogleGenAI } from '@google/genai';
import { db } from './src/server/db.js';
import {
  generateToken,
  verifyPassword,
  authenticateToken,
  requireAuth,
  requireAdmin,
  sanitizeInput,
  AuthenticatedRequest,
} from './src/server/auth.js';
import {
  authLimiter,
  aiLimiter,
  reportLimiter,
  exportLimiter,
} from './src/server/rateLimit.js';
import {
  buildMultilingualSystemPrompt,
  generateLocalSchoolResponseMultilingual,
  detectLanguage,
} from './src/server/aiMultilingual.js';
import { generateStudentsExcelWorkbook } from './src/server/excelExport.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// ==========================================
// 1. SECURITY HEADERS & CORS MIDDLEWARE
// ==========================================

// Parse cookies and JSON bodies
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));

// Security Headers
app.use((req, res, next) => {
  // Clickjacking protection: allow framing by sameorigin
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // CSP: secure against inline script injection while allowing Vite dev & fonts
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https: https://fonts.gstatic.com; connect-src 'self' https: ws: wss:; frame-ancestors 'self';"
  );

  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Strict CORS
  const origin = req.headers.origin as string;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.APP_URL,
  ].filter(Boolean) as string[];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.run.app') || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Attach authenticated user to request if session exists
app.use(authenticateToken as any);

// ==========================================
// 2. AUTHENTICATION & SESSION ENDPOINTS
// ==========================================

// Register Normal User (Cannot register admin)
app.post('/api/auth/register', authLimiter, (req: Request, res: Response) => {
  try {
    const { username, email, password, displayName } = req.body || {};

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanUsername = sanitizeInput(username).toLowerCase();
    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanDisplayName = sanitizeInput(displayName || username);

    // Check if user already exists
    if (db.findUserByUsername(cleanUsername)) {
      return res.status(409).json({ error: 'Username already in use.' });
    }

    if (db.findUserByEmail(cleanEmail)) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Role is strictly forced to 'user' on public registration
    const newUser = db.createUser({
      username: cleanUsername,
      email: cleanEmail,
      password,
      displayName: cleanDisplayName,
      role: 'user',
    });

    const token = generateToken(newUser);

    // Set secure cookie
    res.cookie('campus_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.displayName,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error.message);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// Login (Handles both Normal User and Admin Login)
app.post('/api/auth/login', authLimiter, (req: Request, res: Response) => {
  try {
    const { username, password, requireAdmin: adminOnly } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanIdentifier = String(username).trim().toLowerCase();
    const user = db.findUserByUsername(cleanIdentifier) || db.findUserByEmail(cleanIdentifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValid = verifyPassword(String(password), user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // If logging in via dedicated Admin Portal, verify admin role
    if (adminOnly && user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied: Administrator privileges required for the Admin Portal.',
        code: 'ADMIN_REQUIRED',
      });
    }

    db.updateLastLogin(user.id);
    const token = generateToken(user);

    // Set HttpOnly session cookie
    res.cookie('campus_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'An error occurred during authentication.' });
  }
});

// Get current session
app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user: req.user });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('campus_token', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// 3. USER LOST & FOUND & REPORTING (RBAC & IDOR SAFE)
// ==========================================

// Get user's own submitted reports (Strict IDOR check)
app.get('/api/user/reports', requireAuth as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const reports = db.getUserReports(userId);
    return res.json({ reports });
  } catch (error: any) {
    console.error('Error fetching user reports:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve submitted reports.' });
  }
});

// Submit a new lost or found report by normal user
app.post('/api/user/reports', requireAuth as any, reportLimiter, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, title, category, description, location, date, contact } = req.body || {};

    if (!title || !type || !category || !location) {
      return res.status(400).json({ error: 'Required fields missing (title, type, category, location).' });
    }

    if (type !== 'lost' && type !== 'found') {
      return res.status(400).json({ error: "Type must be either 'lost' or 'found'." });
    }

    const cleanReport = {
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.displayName || req.user!.username,
      type: type as 'lost' | 'found',
      title: sanitizeInput(title),
      category: sanitizeInput(category),
      description: sanitizeInput(description || ''),
      location: sanitizeInput(location),
      date: sanitizeInput(date || new Date().toISOString().split('T')[0]),
      contact: sanitizeInput(contact || req.user!.email),
      status: 'pending' as const,
    };

    const created = db.createReport(cleanReport);
    return res.status(201).json({ success: true, report: created });
  } catch (error: any) {
    console.error('Error creating report:', error.message);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
});

// Admin: View all submitted reports
app.get('/api/admin/reports', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = db.getAllReports();
    return res.json({ reports });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
});

// Admin: Update report status
app.patch('/api/admin/reports/:id', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body || {};

    const updated = db.updateReportStatus(
      id,
      status,
      adminNotes ? sanitizeInput(adminNotes) : undefined
    );

    if (!updated) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    return res.json({ success: true, report: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update report status.' });
  }
});

// ==========================================
// 4A. ADMIN-ONLY STUDENT DATA PERSISTENCE
// ==========================================

// Admin: Retrieve student records stored securely on the server
app.get('/api/admin/students', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const students = db.getStudents();
    const lastSavedAt = db.getStudentsLastSaved();
    return res.json({ success: true, students, lastSavedAt });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve student records from server.' });
  }
});

// Admin: Save/sync student records securely on the server database
app.post('/api/admin/students/save', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { students } = req.body || {};

    if (!Array.isArray(students)) {
      return res.status(400).json({ error: 'Payload must include an array of student records.' });
    }

    const result = db.saveStudents(students, req.user!.id, req.user!.username);
    return res.json({
      success: true,
      message: `Successfully saved ${result.count} student records to server.`,
      count: result.count,
      savedAt: result.savedAt,
    });
  } catch (err: any) {
    console.error('Error saving student records:', err.message);
    return res.status(500).json({ error: 'Failed to save student records on server.' });
  }
});

// ==========================================
// 4. ADMIN-ONLY EXCEL STUDENT DATA EXPORT
// ==========================================

app.post('/api/admin/students/export-excel', requireAdmin as any, exportLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { students, schoolName, filterClass, filterStatus } = req.body || {};

    if (!Array.isArray(students)) {
      return res.status(400).json({ error: 'Invalid students payload for export.' });
    }

    // Generate Excel file on server
    const buffer = await generateStudentsExcelWorkbook({
      schoolName: schoolName || 'Al-Manar International Academy',
      exportedBy: req.user!.displayName || req.user!.username,
      exportDate: new Date().toISOString().split('T')[0],
      students,
      filterClass,
      filterStatus,
    });

    // Audit log this export
    db.logAudit({
      adminId: req.user!.id,
      adminUsername: req.user!.username,
      action: 'export_students_excel',
      details: `Exported ${students.length} student records as Microsoft Excel (.xlsx)`,
    });

    const filename = `CampusOS_Students_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error: any) {
    console.error('Excel Export error:', error.message);
    return res.status(500).json({ error: 'Failed to generate Excel export file.' });
  }
});

// Admin audit logs
app.get('/api/admin/audit-logs', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.getAuditLogs();
    return res.json({ logs });
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

// ==========================================
// 4B. ADMIN USER MANAGEMENT ENDPOINTS
// ==========================================

// Admin: Get all user accounts
app.get('/api/admin/users', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.getAllUsers();
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve user accounts.' });
  }
});

// Admin: Create new user account with name, username, email, password, and role
app.post('/api/admin/users', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, email, password, displayName, role } = req.body || {};

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: 'Full name, username, email, and password are required.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (db.findUserByUsername(cleanUsername)) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    if (db.findUserByEmail(cleanEmail)) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const targetRole = role === 'admin' ? 'admin' : 'user';

    const newUser = db.createUser({
      username: sanitizeInput(cleanUsername),
      email: sanitizeInput(cleanEmail),
      password: String(password),
      displayName: sanitizeInput(displayName),
      role: targetRole,
    });

    db.logAudit({
      adminId: req.user!.id,
      adminUsername: req.user!.username,
      action: 'create_user_account',
      details: `Created user account '${newUser.username}' (${newUser.displayName}) with role '${newUser.role}'`,
    });

    const { passwordHash, ...safeUser } = newUser;
    return res.status(201).json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('Error creating user account:', err.message);
    return res.status(500).json({ error: 'Failed to create user account.' });
  }
});

// Admin: Delete user account
app.delete('/api/admin/users/:id', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = db.deleteUser(id, req.user!.id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    db.logAudit({
      adminId: req.user!.id,
      adminUsername: req.user!.username,
      action: 'delete_user_account',
      details: `Deleted user account with ID '${id}'`,
    });

    return res.json({ success: true, message: 'User account deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete user account.' });
  }
});

// Admin: Update user account
app.patch('/api/admin/users/:id', requireAdmin as any, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { displayName, email, role, password } = req.body || {};

    const updates: any = {};
    if (displayName) updates.displayName = sanitizeInput(displayName);
    if (email) updates.email = sanitizeInput(email);
    if (role === 'admin' || role === 'user') updates.role = role;
    if (password && String(password).trim().length >= 6) updates.password = String(password).trim();

    const result = db.updateUser(id, updates);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    db.logAudit({
      adminId: req.user!.id,
      adminUsername: req.user!.username,
      action: 'update_user_account',
      details: `Updated user account with ID '${id}'`,
    });

    return res.json({ success: true, user: result.user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user account.' });
  }
});

// ==========================================
// 5. CAMPUS AI MULTILINGUAL ENDPOINT
// ==========================================

// Health check
app.get('/api/campus-ai/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    status: 'ok',
    configured: hasKey,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    languages: ['en', 'fr', 'ar', 'darija'],
  });
});

app.post('/api/campus-ai', aiLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, schoolContext, history, language } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt parameter.' });
    }

    const cleanPrompt = sanitizeInput(prompt);
    const detectedLang = detectLanguage(cleanPrompt);
    const resolvedLang = detectedLang !== 'en' ? detectedLang : (language || 'en');

    // PRIVACY ENFORCEMENT: If non-admin user queries AI, redact guardian phone numbers
    let sanitizedContext = schoolContext;
    if (req.user?.role !== 'admin' && schoolContext && Array.isArray(schoolContext.students)) {
      sanitizedContext = {
        ...schoolContext,
        students: schoolContext.students.map((s: any) => ({
          studentId: s.studentId,
          fullName: s.fullName,
          className: s.className,
          todayAttendanceStatus: s.todayAttendanceStatus,
          // Redact guardian phone for normal users
          guardianContact: '[Protected Information]',
        })),
        todayAbsentees: (schoolContext.todayAbsentees || []).map((s: any) => ({
          ...s,
          guardianContact: '[Protected Information]',
        })),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    // If API key is not present, use the multilingual analytics engine
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      const fallbackText = generateLocalSchoolResponseMultilingual(
        cleanPrompt,
        sanitizedContext || {},
        resolvedLang
      );
      return res.json({
        text: fallbackText,
        source: 'local-analytics-multilingual',
        model: 'local-analytics-engine',
        detectedLanguage: detectedLang,
      });
    }

    // Call Google GenAI SDK with multilingual prompt
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = buildMultilingualSystemPrompt(sanitizedContext, resolvedLang);

    // Build chat contents with history
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-8)) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: cleanPrompt }],
    });

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out, using instant analytics')), 4000)
    );

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;

    return res.json({
      text: response.text || 'No response generated.',
      source: 'gemini-api',
      model: modelName,
      detectedLanguage: detectedLang,
    });
  } catch (error: any) {
    console.error('Campus AI API error, falling back to multilingual analytics:', error.message);
    const { schoolContext, language, prompt } = req.body || {};
    const fallbackText = generateLocalSchoolResponseMultilingual(
      prompt || '',
      schoolContext || {},
      language || 'en'
    );

    return res.json({
      text: fallbackText,
      source: 'local-fallback',
      model: 'analytics-engine',
      detectedLanguage: detectLanguage(prompt || ''),
    });
  }
});

// ==========================================
// 6. SPA CLIENT ROUTING & DEV SERVER
// ==========================================

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus OS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
