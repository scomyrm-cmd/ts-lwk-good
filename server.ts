import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Health check for AI configuration
app.get('/api/campus-ai/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    status: 'ok',
    configured: hasKey,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  });
});

// Helper function for intelligent local school data analysis and student queries
function generateLocalSchoolResponse(prompt: string, stats: any, lang: string): string {
  const p = (prompt || '').trim().toLowerCase();
  const students: any[] = Array.isArray(stats?.students) ? stats.students : [];
  const todayAbsentees: any[] = Array.isArray(stats?.todayAbsentees) ? stats.todayAbsentees : [];
  const topAbsentees: any[] = Array.isArray(stats?.topAbsentees) ? stats.topAbsentees : [];
  const rostersByClass: Record<string, any[]> = stats?.rostersByClass || {};

  // Check if query matches a student by name or studentId
  const matchedStudent = students.find((s: any) => {
    const fullName = (s.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const id = (s.studentId || '').toLowerCase();
    const first = (s.firstName || '').toLowerCase();
    const last = (s.lastName || '').toLowerCase();
    return p.includes(fullName) || p.includes(id) || (first.length > 2 && p.includes(first)) || (last.length > 2 && p.includes(last));
  });

  if (matchedStudent) {
    if (p.includes('draft') || p.includes('letter') || p.includes('message') || p.includes('email') || p.includes('notice')) {
      return `### Official School Notice Draft\n\n` +
        `**To the Parent/Guardian of ${matchedStudent.fullName}**\n` +
        `**Student ID:** ${matchedStudent.studentId} | **Class:** ${matchedStudent.className}\n` +
        `**Contact on File:** ${matchedStudent.guardianContact}\n\n` +
        `Dear Parent/Guardian,\n\n` +
        `We are writing from the Administration Office regarding **${matchedStudent.fullName}**. According to our official records, ${matchedStudent.fullName} is currently recorded as **${matchedStudent.todayAttendanceStatus.toUpperCase()}** for today (${stats.date || 'today'})${matchedStudent.todayAttendanceNote ? ` (${matchedStudent.todayAttendanceNote})` : ''}.\n\n` +
        `Their cumulative attendance rate currently stands at **${matchedStudent.attendanceRatePercent}%** with **${matchedStudent.totalAbsences} recorded absence(s)**.\n\n` +
        `Please reach out to the school administration at your earliest convenience if you have documentation to provide or wish to discuss their academic attendance.\n\n` +
        `Warm regards,\n` +
        `**Campus Administration Office**`;
    }

    return `### Student Profile: ${matchedStudent.fullName} (${matchedStudent.studentId})\n\n` +
      `- **Class / Grade:** ${matchedStudent.className}\n` +
      `- **Today's Attendance Status:** **${matchedStudent.todayAttendanceStatus.toUpperCase()}**${matchedStudent.todayAttendanceNote ? ` (${matchedStudent.todayAttendanceNote})` : ''}\n` +
      `- **Attendance Record:** ${matchedStudent.attendanceRatePercent}% overall (${matchedStudent.totalPresent || 0} present, ${matchedStudent.totalAbsences || 0} absent, ${matchedStudent.totalLate || 0} late, ${matchedStudent.totalExcused || 0} excused)\n` +
      `- **Guardian Contact:** ${matchedStudent.guardianContact || 'None on file'}\n` +
      `- **Date of Birth:** ${matchedStudent.dateOfBirth || 'Not specified'}\n` +
      `- **Gender:** ${matchedStudent.gender || 'Not specified'}\n` +
      `- **Administrative Notes:** ${matchedStudent.notes || 'None'}\n` +
      (matchedStudent.recentAbsences?.length > 0
        ? `\n**Recent Absence History:**\n` +
          matchedStudent.recentAbsences.map((a: any) => `  • ${a.date}: ${a.reason}${a.notes ? ` - ${a.notes}` : ''}`).join('\n')
        : '') +
      (matchedStudent.associatedLostFound?.length > 0
        ? `\n**Associated Lost & Found Items:**\n` +
          matchedStudent.associatedLostFound.map((i: any) => `  • ${i.itemName} (${i.status})`).join('\n')
        : '');
  }

  // Check if query is asking who is absent
  if (p.includes('absent') && (p.includes('who') || p.includes('list') || p.includes('today') || p.includes('how many') || p.includes('show'))) {
    if (todayAbsentees.length === 0) {
      return `### Today's Absentee Registry\n\nAll registered students are currently present or unmarked. There are no students marked absent today (${stats.date || 'today'}).`;
    }
    return `### Students Marked Absent Today (${stats.date || 'Today'})\n\n` +
      `There are **${todayAbsentees.length} student(s)** recorded absent today:\n\n` +
      todayAbsentees.map((s: any, idx: number) => 
        `${idx + 1}. **${s.fullName}** (${s.studentId})\n` +
        `   - **Class:** ${s.className}\n` +
        `   - **Guardian Phone:** ${s.guardianContact}\n` +
        `   - **Recorded Reason / Note:** ${s.note || 'No specific note provided'}\n` +
        `   - **Cumulative Absences:** ${s.cumulativeAbsences ?? s.totalAbsences ?? 0}`
      ).join('\n\n') +
      `\n\n*Administrators can call guardian phone numbers directly above to follow up on unexcused absences.*`;
  }

  // Check if query is asking about a specific class
  for (const [className, roster] of Object.entries(rostersByClass)) {
    if (p.includes(className.toLowerCase())) {
      return `### Class Roster: ${className} (${roster.length} Students)\n\n` +
        roster.map((s: any, idx: number) => 
          `${idx + 1}. **${s.fullName}** (${s.studentId}) — Status Today: **${s.todayStatus.toUpperCase()}**`
        ).join('\n') +
        `\n\n*Ask me about any specific student above for their full profile, guardian contact, or absence history.*`;
    }
  }

  // Check if query is asking for top absentees
  if (p.includes('most') || p.includes('highest') || p.includes('frequent') || p.includes('chronic')) {
    if (topAbsentees.length === 0) {
      return `There are currently no students with chronic absence records.`;
    }
    return `### Students with Highest Absence Count\n\n` +
      topAbsentees.map((s: any, idx: number) => 
        `${idx + 1}. **${s.fullName}** (${s.studentId}) — **${s.totalAbsences} absences** (Rate: ${s.attendanceRate}) | Class: ${s.className} | Guardian: ${s.guardianContact}`
      ).join('\n');
  }

  // Lost and found query
  if (p.includes('lost') || p.includes('found') || p.includes('item') || p.includes('unclaimed')) {
    const items = stats?.lostAndFoundList || [];
    return `### Lost & Found Status\n\n` +
      `- **Pending Unclaimed Items:** ${stats?.lostAndFoundMetrics?.unclaimedPending ?? 0}\n` +
      `- **Total Reported:** ${stats?.lostAndFoundMetrics?.totalReported ?? 0}\n` +
      `- **Successfully Claimed:** ${stats?.lostAndFoundMetrics?.claimedItems ?? 0}\n\n` +
      (items.length > 0
        ? `**Recent Items:**\n` +
          items.slice(0, 6).map((i: any) => `• **${i.itemName}** (${i.category}) — Location: ${i.location} | Status: *${i.status}* | Reported: ${i.dateReported}`).join('\n')
        : 'No items currently in the registry.');
  }

  // General school summary
  return `### Campus Administration Overview (${stats.date || 'Today'})\n\n` +
    `- **Total Registered Students:** ${stats.studentMetrics?.totalRegistered ?? 0}\n` +
    `- **Today's Attendance Rate:** ${stats.todayAttendance?.attendanceRate ?? 0}%\n` +
    `- **Present:** ${stats.todayAttendance?.present ?? 0} | **Absent:** ${stats.todayAttendance?.absent ?? 0} | **Late:** ${stats.todayAttendance?.late ?? 0} | **Excused:** ${stats.todayAttendance?.excused ?? 0}\n` +
    `- **Lost & Found:** ${stats.lostAndFoundMetrics?.unclaimedPending ?? 0} unclaimed items\n\n` +
    `**You can ask me anything about:**\n` +
    `• Any specific student (e.g. *"Tell me about Marcus Vance"* or *"What is Sarah's guardian phone?"*)\n` +
    `• Absences (e.g. *"Who is absent today?"* or *"Who has the most absences?"*)\n` +
    `• Class rosters (e.g. *"Show all students in Grade 10-A"*)\n` +
    `• Parent communication (e.g. *"Draft an absence letter for Marcus Vance"*)\n` +
    `• Lost & Found repository status and items`;
}

// Campus AI Endpoint
app.post('/api/campus-ai', async (req, res) => {
  try {
    const { prompt, schoolContext, history, language } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt parameter.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    // If API key is not present, use the intelligent local school analytics engine
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      const fallbackText = generateLocalSchoolResponse(prompt, schoolContext || {}, language || 'en');
      return res.json({
        text: fallbackText,
        source: 'local-analytics',
        model: 'local-analytics-engine',
      });
    }

    // Call Google GenAI SDK
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are Campus AI, an expert school administration AI assistant embedded within the "Campus OS" educational management platform.
You are having an ongoing, conversational consultation with authorized school administrators.

YOUR PRIMARY CAPABILITIES & RESPONSIBILITIES:
1. FULL STUDENT INTELLIGENCE:
   - You have full, authorized access to the school's live administration database provided in context.
   - When administrators ask about ANY student (by name, student ID, class, attendance record, contact info, notes, or history), answer accurately, specifically, and conversationally.
   - For student profile inquiries (e.g. "Tell me about Marcus Vance" or "STU-1002"), summarize:
     • Full Name & Student ID
     • Class / Grade
     • Today's Attendance Status (Present, Absent, Late, Excused) and any note
     • Overall Attendance Rate & Total Absences
     • Guardian Contact (phone/email)
     • Date of Birth & Gender
     • Any administrative notes or recent absence dates/reasons
     • Any associated lost & found items

2. ATTENDANCE & ABSENCE QUERIES:
   - If asked "Who is absent today?" or "List absent students", list all students currently marked absent, their class, today's note/reason, and their guardian phone numbers so the administrator can contact families immediately.
   - If asked about late arrivals or excused absences, list them with notes.
   - If asked who has the highest or most frequent absences, list the top absentees from the data.

3. CLASS ROSTERS & BREAKDOWNS:
   - If asked about students in a specific class (e.g. "Who is in Grade 10-A?"), list all enrolled students with their current attendance status.
   - Provide class statistics (total students, attendance rate, absence rate).

4. DRAFTING PARENT & GUARDIAN COMMUNICATIONS:
   - If asked to draft a notice, letter, email, or message to a student's parent or guardian, generate a professional, polite, and personalized draft referencing the student's name, class, date, and specific attendance status/reason.

5. LOST & FOUND:
   - Answer questions about lost or found items, locations, reporting dates, and claims.

6. CONVERSATIONAL MEMORY & TONE:
   - Speak in a professional, courteous, helpful tone as an executive school administrative advisor.
   - Remember previous turns in the chat (e.g. if the administrator asks "What about his parents?" or "Draft a message for him", understand who "him" refers to from context).
   - Use clean, structured Markdown formatting (bullet points, bold highlights, tables where appropriate).

7. MULTI-LANGUAGE SUPPORT:
   - Seamlessly respond in the language requested by the administrator (${language || 'English'}), supporting English, French, and Arabic.
   - When responding in Arabic, use elegant, natural, professional Arabic phrasing (الفصحى).

LIVE SCHOOL DATABASE CONTEXT:
${JSON.stringify(schoolContext, null, 2)}`;

    // Build chat contents
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
      parts: [{ text: prompt }],
    });

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out, using instant analytics')), 3500)
    );

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;

    return res.json({
      text: response.text || 'No response generated.',
      source: 'gemini-api',
      model: modelName,
    });
  } catch (error: any) {
    console.error('Campus AI API error, falling back to live school data analysis:', error.message);
    const { schoolContext, language, prompt } = req.body || {};
    const fallbackText = generateLocalSchoolResponse(prompt, schoolContext || {}, language || 'en');

    return res.json({
      text: fallbackText,
      source: 'local-fallback',
      model: 'analytics-engine',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

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
