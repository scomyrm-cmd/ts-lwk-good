export type DetectedLanguage = 'en' | 'fr' | 'ar' | 'darija';

// Detect query language and dialect
export function detectLanguage(text: string): DetectedLanguage {
  const t = (text || '').trim().toLowerCase();

  // Check for Arabic unicode script
  const hasArabicScript = /[\u0600-\u06FF]/.test(t);

  // Moroccan Darija distinct keywords in Arabic script or Arabizi
  const darijaKeywordsArabic = [
    'شكون', 'واش', 'كاين', 'عطيني', 'ديال', 'دابا', 'بزاف', 'علاش',
    'ماشي', 'زوين', 'فين', 'حوايج', 'سميتو', 'ضايع', 'سول', 'شنو',
    'أشنو', 'هاد', 'وليدات', 'والديه', 'مكاينش', 'كاينين', 'جيب',
    'وريني', 'بغيت', 'عفاك', 'ديالو', 'ديالها', 'ديالهم'
  ];

  const darijaArabiziKeywords = [
    'chkon', 'wach', 'kayn', '3tini', 'dial', 'daba', 'bzaf', '3lach',
    'machi', 'fin', 'tlemid', 'ghiyab', 'ghayeb', 'daye3', 'chno', 'ashno',
    'had', 'bghet', '3afak', 'chokran'
  ];

  if (hasArabicScript) {
    const isDarija = darijaKeywordsArabic.some((k) => t.includes(k));
    if (isDarija) return 'darija';
    return 'ar'; // Standard Arabic Fusha
  }

  const isArabiziDarija = darijaArabiziKeywords.some((k) => t.includes(k));
  if (isArabiziDarija) return 'darija';

  // French accented characters
  if (/[éèêëàâôûîïç]/.test(t)) {
    return 'fr';
  }

  // French keywords with word boundaries
  const frenchKeywords = [
    'bonjour', 'salut', 'qui', 'est', 'sont', 'présent', 'absent', 'élève',
    'étudiant', 'école', 'merci', 'liste', 'classe', 'veuillez', 'rédiger',
    'lettre', 'parents', 'retard', 'objets', 'perdu', 'trouvé', "aujourd'hui",
    'combien', 'donne-moi', 'donnez-moi', 'profil'
  ];

  const hasFrenchKeyword = frenchKeywords.some((k) => {
    const regex = new RegExp(`(^|\\s|[.,!?'"()/-])${k}($|\\s|[.,!?'"()/-])`, 'i');
    return regex.test(t);
  });

  if (hasFrenchKeyword) {
    // Disambiguate English vs French for common words like 'absent'
    if (/\b(who|what|where|when|which|how|tell|show)\b/i.test(t)) {
      return 'en';
    }
    return 'fr';
  }

  return 'en';
}

// Build comprehensive multilingual system prompt for Gemini
export function buildMultilingualSystemPrompt(schoolContext: any, currentLang: string): string {
  return `You are Campus AI, an expert, friendly, and bilingual/multilingual school administration AI assistant embedded within the "Campus OS" educational management platform.
You are actively chatting with authorized school administrators and staff.

CORE INTELLIGENCE & MULTILINGUAL CAPABILITIES:
1. SEAMLESS MULTILINGUAL & DIALECT DETECTION:
   - You natively and effortlessly speak:
     • English
     • French (Français)
     • Modern Standard Arabic (اللغة العربية الفصحى)
     • Moroccan Arabic / Darija (الدارجة المغربية)
   - AUTOMATICALLY DETECT the language and dialect of each user message. If the user writes in French, answer in French. If in Arabic, answer in Arabic. If in Moroccan Darija (e.g. "شكون لي غايب اليوم؟", "عطيني معلومات على التلميذ...", "واش كاين شي حوايج ضايعين؟"), answer warmly and naturally in Moroccan Darija!
   - Allow users to switch languages at any moment without resetting the chat.
   - For Moroccan Darija, use natural Moroccan expressions (e.g., "أهلاً بك! مرحباً بك فـ Campus AI. بالنسبة للغياب ديال اليوم...", "شكون التلميذ لي بغيتي معلومات عليه؟", "هاد التلميذ كيقرا فـ...").

2. INTERACTIVE & ENGAGING CONVERSATION:
   - Do not sound like a robotic search engine. Be professional, warm, engaging, and supportive.
   - Retain conversational context and refer back to previously discussed students or topics naturally.
   - Proactively ask relevant follow-up questions (e.g. "Would you like me to draft a message to their guardian?" or "واش بغيتي نوجد ليك رسالة إشعار لولي أمره؟").

3. FULL STUDENT & ATTENDANCE INTELLIGENCE:
   - You have authorized access to the live school database provided in context.
   - Answer accurately regarding student profiles, today's attendance (Present, Absent, Late, Excused), cumulative absence counts, and guardian contacts.
   - For absent students, always provide their class and guardian phone number so administrators can follow up.
   - If asked to draft parent communication (absence notices, meeting requests, warning letters), draft a polished, polite, and personalized letter in the requested language.

4. ACCURACY & ANTI-HALLUCINATION POLICY:
   - Base all student information strictly on the provided school database.
   - If asked about a student or record that does not exist in the database, answer honestly:
     • English: "I searched the school database, but no record was found for that student name or ID."
     • French: "J'ai vérifié les registres scolaires, mais aucun dossier ne correspond à ce nom ou identifiant."
     • Arabic: "لقد تحققت من السجل المدرسي، ولكن لم أجد أي سجل مسجل بهذا الاسم أو الرقم التعريفي."
     • Darija: "قلبت فـ السجل ديال المدرسة ولكن مالقيت حتى تلميذ مسجل بهاد السمية أو الرقم."
   - Do NOT invent imaginary student records, grades, or emergency numbers.

5. LOST & FOUND STATUS:
   - Answer questions about reported lost and found items, their categories, locations, and claim status.

LIVE SCHOOL DATABASE CONTEXT:
${JSON.stringify(schoolContext, null, 2)}`;
}

// Multilingual Local School Fallback Response Engine
// Guarantees high-quality responses even if Gemini API key is not configured or offline
export function generateLocalSchoolResponseMultilingual(
  prompt: string,
  stats: any,
  langPreference?: string
): string {
  const detected = detectLanguage(prompt);
  const lang = detected !== 'en' ? detected : (langPreference || 'en');
  const p = (prompt || '').trim().toLowerCase();

  const students: any[] = Array.isArray(stats?.students) ? stats.students : [];
  const todayAbsentees: any[] = Array.isArray(stats?.todayAbsentees) ? stats.todayAbsentees : [];
  const topAbsentees: any[] = Array.isArray(stats?.topAbsentees) ? stats.topAbsentees : [];
  const rostersByClass: Record<string, any[]> = stats?.rostersByClass || {};

  // Check for student query
  const matchedStudent = students.find((s: any) => {
    const fullName = (s.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const id = (s.studentId || '').toLowerCase();
    const first = (s.firstName || '').toLowerCase();
    const last = (s.lastName || '').toLowerCase();
    return p.includes(fullName) || p.includes(id) || (first.length > 2 && p.includes(first)) || (last.length > 2 && p.includes(last));
  });

  if (matchedStudent) {
    const wantsDraft = p.includes('draft') || p.includes('letter') || p.includes('message') ||
      p.includes('notice') || p.includes('lettre') || p.includes('rédiger') ||
      p.includes('رسالة') || p.includes('إشعار') || p.includes('كتب');

    if (wantsDraft) {
      if (lang === 'fr') {
        return `### Brouillon d'avis scolaire officiel\n\n` +
          `**Aux parents / tuteur de ${matchedStudent.fullName}**\n` +
          `**ID élève :** ${matchedStudent.studentId} | **Classe :** ${matchedStudent.className}\n` +
          `**Contact au dossier :** ${matchedStudent.guardianContact}\n\n` +
          `Chers parents,\n\n` +
          `La direction de l'établissement vous informe que **${matchedStudent.fullName}** est enregistré(e) comme **${matchedStudent.todayAttendanceStatus.toUpperCase()}** pour la journée du ${stats.date || "aujourd'hui"}${matchedStudent.todayAttendanceNote ? ` (${matchedStudent.todayAttendanceNote})` : ''}.\n\n` +
          `Son taux d'assiduité global est actuellement de **${matchedStudent.attendanceRatePercent}%** avec **${matchedStudent.totalAbsences} absence(s)** enregistrée(s).\n\n` +
          `Merci de bien vouloir contacter l'administration de l'établissement dès que possible pour régulariser cette situation.\n\n` +
          `Cordialement,\n` +
          `**L'Administration de Campus OS**`;
      }

      if (lang === 'darija') {
        return `### مسودة إشعار بالغياب لولي الأمر (بالدارجة المغربية)\n\n` +
          `**إلى ولي أمر التلميذ(ة): ${matchedStudent.fullName}**\n` +
          `**الرقم التعريفي:** ${matchedStudent.studentId} | **القسم:** ${matchedStudent.className}\n` +
          `**رقم الهاتف المسجل:** ${matchedStudent.guardianContact}\n\n` +
          `السلام عليكم ورحمة الله،\n\n` +
          `كنتصلو بكم من إدارة المؤسسة بخصوص التلميذ(ة) **${matchedStudent.fullName}**. السجلات الرسمية ديال اليوم (${stats.date || 'اليوم'}) كتوضح أن التلميذ **${matchedStudent.todayAttendanceStatus === 'absent' ? 'غايب' : matchedStudent.todayAttendanceStatus}**${matchedStudent.todayAttendanceNote ? ` (${matchedStudent.todayAttendanceNote})` : ''}.\n\n` +
          `نسبة الحضور التراكمية ديالو واصلة لـ **${matchedStudent.attendanceRatePercent}%** مع تسجيل **${matchedStudent.totalAbsences} غياب(ات)**.\n\n` +
          `كنطلبو منكم تواصلو مع إدارة المؤسسة في أقرب وقت لتبرير الغياب أو مناقشة الوضعية الدراسية ديال التلميذ.\n\n` +
          `مع خالص التقدير،\n` +
          `**إدارة المؤسسة التعليمية**`;
      }

      if (lang === 'ar') {
        return `### مسودة إشعار غياب رسمي\n\n` +
          `**إلى ولي أمر التلميذ(ة): ${matchedStudent.fullName}**\n` +
          `**الرقم المدرسي:** ${matchedStudent.studentId} | **الصف:** ${matchedStudent.className}\n` +
          `**هاتف التواصل:** ${matchedStudent.guardianContact}\n\n` +
          `تحية طيبة وبعد،\n\n` +
          `تود إدارة المؤسسة إحاطتكم علماً بأن التلميذ(ة) **${matchedStudent.fullName}** مسجل(ة) كـ **${matchedStudent.todayAttendanceStatus.toUpperCase()}** لهذا اليوم (${stats.date || 'اليوم'})${matchedStudent.todayAttendanceNote ? ` (${matchedStudent.todayAttendanceNote})` : ''}.\n\n` +
          `تبلغ نسبة الحضور الإجمالية للطالب حالياً **${matchedStudent.attendanceRatePercent}%** مع تسجيل **${matchedStudent.totalAbsences} غياب**.\n\n` +
          `نرجو منكم التواصل مع الإدارة المدرسية لتزويدنا بالوثائق المبررة للغياب.\n\n` +
          `وتفضلوا بقبول فائق الاحترام والتقدير،\n` +
          `**إدارة المؤسسة التعليمية**`;
      }

      // English draft
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

    // Student Profile
    if (lang === 'fr') {
      return `### Fiche de l'élève : ${matchedStudent.fullName} (${matchedStudent.studentId})\n\n` +
        `- **Classe :** ${matchedStudent.className}\n` +
        `- **Statut de présence aujourd'hui :** **${matchedStudent.todayAttendanceStatus.toUpperCase()}**${matchedStudent.todayAttendanceNote ? ` (${matchedStudent.todayAttendanceNote})` : ''}\n` +
        `- **Taux d'assiduité :** ${matchedStudent.attendanceRatePercent}% (${matchedStudent.totalPresent || 0} présent(s), ${matchedStudent.totalAbsences || 0} absence(s), ${matchedStudent.totalLate || 0} retard(s))\n` +
        `- **Contact tuteur :** ${matchedStudent.guardianContact || 'Aucun au dossier'}\n` +
        `- **Date de naissance :** ${matchedStudent.dateOfBirth || 'Non renseignée'}\n` +
        `- **Genre :** ${matchedStudent.gender || 'Non renseigné'}\n` +
        `- **Remarques :** ${matchedStudent.notes || 'Aucune'}\n\n` +
        `*Souhaitez-vous que je prépare un avis ou une lettre d'absence pour les parents ?*`;
    }

    if (lang === 'darija' || lang === 'ar') {
      return `### الملف الشخصي للتلميذ: ${matchedStudent.fullName} (${matchedStudent.studentId})\n\n` +
        `- **القسم / المستوى:** ${matchedStudent.className}\n` +
        `- **حالة الحضور اليوم:** **${matchedStudent.todayAttendanceStatus === 'absent' ? 'غائب' : matchedStudent.todayAttendanceStatus === 'present' ? 'حاضر' : matchedStudent.todayAttendanceStatus}**${matchedStudent.todayAttendanceNote ? ` (${matchedStudent.todayAttendanceNote})` : ''}\n` +
        `- **نسبة الحضور الإجمالية:** ${matchedStudent.attendanceRatePercent}% (${matchedStudent.totalAbsences || 0} غيابات مسجلة)\n` +
        `- **هاتف ولي الأمر:** ${matchedStudent.guardianContact || 'غير مسجل'}\n` +
        `- **تاريخ الازدياد:** ${matchedStudent.dateOfBirth || 'غير محدد'}\n` +
        `- **ملاحظات إدارية:** ${matchedStudent.notes || 'لا توجد'}\n\n` +
        `*واش بغيتي نوجد ليك رسالة إشعار لولي أمره أو نتواصل معه؟*`;
    }

    return `### Student Profile: ${matchedStudent.fullName} (${matchedStudent.studentId})\n\n` +
      `- **Class / Grade:** ${matchedStudent.className}\n` +
      `- **Today's Attendance Status:** **${matchedStudent.todayAttendanceStatus.toUpperCase()}**${matchedStudent.todayAttendanceNote ? ` (${matchedStudent.todayAttendanceNote})` : ''}\n` +
      `- **Attendance Record:** ${matchedStudent.attendanceRatePercent}% overall (${matchedStudent.totalPresent || 0} present, ${matchedStudent.totalAbsences || 0} absent, ${matchedStudent.totalLate || 0} late, ${matchedStudent.totalExcused || 0} excused)\n` +
      `- **Guardian Contact:** ${matchedStudent.guardianContact || 'None on file'}\n` +
      `- **Date of Birth:** ${matchedStudent.dateOfBirth || 'Not specified'}\n` +
      `- **Gender:** ${matchedStudent.gender || 'Not specified'}\n` +
      `- **Administrative Notes:** ${matchedStudent.notes || 'None'}\n\n` +
      `*Would you like me to draft an absence notice or contact letter to their parents?*`;
  }

  // Absentees today query
  const asksAboutAbsentees = (p.includes('absent') || p.includes('غياب') || p.includes('غايب') || p.includes('qui est absent')) &&
    (p.includes('who') || p.includes('list') || p.includes('today') || p.includes('شكون') || p.includes('اليوم') || p.includes('combien') || p.includes('qui') || p.includes("aujourd'hui") || p.includes('liste'));

  if (asksAboutAbsentees) {
    if (todayAbsentees.length === 0) {
      if (lang === 'fr') return `### Registre des absences d'aujourd'hui\n\nTous les élèves inscrits sont présents ou non marqués. Aucun élève n'est enregistré comme absent aujourd'hui (${stats.date || "aujourd'hui"}).`;
      if (lang === 'darija' || lang === 'ar') return `### لائحة الغياب لهذا اليوم (${stats.date || 'اليوم'})\n\nجميع التلاميذ المسجلين حاضرون اليوم، لا يوجد أي غياب مسجل حالياً. تبارك الله على وليداتنا!`;
      return `### Today's Absentee Registry\n\nAll registered students are currently present or unmarked. There are no students marked absent today (${stats.date || 'today'}).`;
    }

    if (lang === 'fr') {
      return `### Élèves absents aujourd'hui (${stats.date || "Aujourd'hui"})\n\n` +
        `Il y a actuellement **${todayAbsentees.length} élève(s)** absent(s) :\n\n` +
        todayAbsentees.map((s: any, idx: number) =>
          `${idx + 1}. **${s.fullName}** (${s.studentId})\n` +
          `   - **Classe :** ${s.className}\n` +
          `   - **Téléphone tuteur :** ${s.guardianContact}\n` +
          `   - **Motif / Remarque :** ${s.note || 'Aucune remarque'}\n` +
          `   - **Total absences cumulées :** ${s.cumulativeAbsences ?? s.totalAbsences ?? 0}`
        ).join('\n\n') +
        `\n\n*Les administrateurs peuvent contacter directement les tuteurs via les numéros ci-dessus.*`;
    }

    if (lang === 'darija' || lang === 'ar') {
      return `### لائحة التلاميذ الغائبين اليوم (${stats.date || 'اليوم'})\n\n` +
        `كاينين حالياً **${todayAbsentees.length} تلميذ(ة)** مسجلين فـ الغياب اليوم:\n\n` +
        todayAbsentees.map((s: any, idx: number) =>
          `${idx + 1}. **${s.fullName}** (${s.studentId})\n` +
          `   - **القسم:** ${s.className}\n` +
          `   - **هاتف ولي الأمر:** ${s.guardianContact}\n` +
          `   - **سبب الغياب / ملاحظة:** ${s.note || 'بدون مبرر حالياً'}\n` +
          `   - **مجموع الغيابات السابقة:** ${s.cumulativeAbsences ?? s.totalAbsences ?? 0}`
        ).join('\n\n') +
        `\n\n*يمكن للإدارة الاتصال بأولياء الأمور مباشرة عبر الأرقام أعلاه لمتابعة أسباب الغياب.*`;
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

  // Lost and found query
  if (p.includes('lost') || p.includes('found') || p.includes('perdu') || p.includes('ضايع') || p.includes('حوايج')) {
    const items = stats?.lostAndFoundList || [];
    if (lang === 'fr') {
      return `### État des Objets Perdus & Trouvés\n\n` +
        `- **Objets non réclamés en attente :** ${stats?.lostAndFoundMetrics?.unclaimedPending ?? 0}\n` +
        `- **Total des objets signalés :** ${stats?.lostAndFoundMetrics?.totalReported ?? 0}\n` +
        `- **Objets restitués avec succès :** ${stats?.lostAndFoundMetrics?.claimedItems ?? 0}\n\n` +
        (items.length > 0
          ? `**Objets récents :**\n` +
            items.slice(0, 5).map((i: any) => `• **${i.itemName}** (${i.category}) — Lieu : ${i.location} | Statut : *${i.status}*`).join('\n')
          : 'Aucun objet actuellement enregistré.');
    }

    if (lang === 'darija' || lang === 'ar') {
      return `### وضعية الأشياء الضائعة والمعثور عليها (Lost & Found)\n\n` +
        `- **أشياء في انتظار أصحابها:** ${stats?.lostAndFoundMetrics?.unclaimedPending ?? 0}\n` +
        `- **مجموع الأشياء المبلغ عنها:** ${stats?.lostAndFoundMetrics?.totalReported ?? 0}\n` +
        `- **أشياء تم استرجاعها:** ${stats?.lostAndFoundMetrics?.claimedItems ?? 0}\n\n` +
        (items.length > 0
          ? `**أحدث الأغراض:**\n` +
            items.slice(0, 5).map((i: any) => `• **${i.itemName}** (${i.category}) — المكان: ${i.location} | الحالة: *${i.status}*`).join('\n')
          : 'لا توجد أغراض مسجلة حالياً.');
    }

    return `### Lost & Found Status\n\n` +
      `- **Pending Unclaimed Items:** ${stats?.lostAndFoundMetrics?.unclaimedPending ?? 0}\n` +
      `- **Total Reported:** ${stats?.lostAndFoundMetrics?.totalReported ?? 0}\n` +
      `- **Successfully Claimed:** ${stats?.lostAndFoundMetrics?.claimedItems ?? 0}\n\n` +
      (items.length > 0
        ? `**Recent Items:**\n` +
          items.slice(0, 5).map((i: any) => `• **${i.itemName}** (${i.category}) — Location: ${i.location} | Status: *${i.status}*`).join('\n')
        : 'No items currently in the registry.');
  }

  // General fallback overview
  if (lang === 'fr') {
    return `### Aperçu de l'administration scolaire (${stats.date || "Aujourd'hui"})\n\n` +
      `- **Élèves inscrits :** ${stats.studentMetrics?.totalRegistered ?? 0}\n` +
      `- **Taux de présence aujourd'hui :** ${stats.todayAttendance?.attendanceRate ?? 0}%\n` +
      `- **Présents :** ${stats.todayAttendance?.present ?? 0} | **Absents :** ${stats.todayAttendance?.absent ?? 0} | **Retards :** ${stats.todayAttendance?.late ?? 0}\n\n` +
      `**Vous pouvez me poser des questions sur :**\n` +
      `• Tout élève (ex: *"Parle-moi de Marcus Vance"* ou *"Contact tuteur de Sarah"*)\n` +
      `• Les absences (ex: *"Qui est absent aujourd'hui ?"*)\n` +
      `• Rédaction de lettres aux parents\n` +
      `• Objets perdus et trouvés`;
  }

  if (lang === 'darija' || lang === 'ar') {
    return `### نظرة عامة على المؤسسة التعليمية (${stats.date || 'اليوم'})\n\n` +
      `- **مجموع التلاميذ المسجلين:** ${stats.studentMetrics?.totalRegistered ?? 0}\n` +
      `- **نسبة الحضور اليوم:** ${stats.todayAttendance?.attendanceRate ?? 0}%\n` +
      `- **الحاضرون:** ${stats.todayAttendance?.present ?? 0} | **الغياب:** ${stats.todayAttendance?.absent ?? 0} | **التأخرات:** ${stats.todayAttendance?.late ?? 0}\n\n` +
      `**يمكنك سؤالي باللغة العربية أو الدارجة المغربية أو الفرنسية أو الإنجليزية عن:**\n` +
      `• أي تلميذ (مثلاً: *"عطيني معلومات على Marcus Vance"* أو *"شكون هما والدي التلميذ؟"*)\n` +
      `• لائحة الغياب (مثلاً: *"شكون لي غايب اليوم؟"*)\n` +
      `• كتابة رسائل وإشعارات لأولياء الأمور\n` +
      `• الأشياء الضائعة في المؤسسة (Lost & Found)`;
  }

  return `### Campus Administration Overview (${stats.date || 'Today'})\n\n` +
    `- **Total Registered Students:** ${stats.studentMetrics?.totalRegistered ?? 0}\n` +
    `- **Today's Attendance Rate:** ${stats.todayAttendance?.attendanceRate ?? 0}%\n` +
    `- **Present:** ${stats.todayAttendance?.present ?? 0} | **Absent:** ${stats.todayAttendance?.absent ?? 0} | **Late:** ${stats.todayAttendance?.late ?? 0}\n\n` +
    `**You can ask me anything in English, French, Arabic, or Moroccan Darija about:**\n` +
    `• Any specific student (e.g. *"Tell me about Marcus Vance"* or *"What is Sarah's guardian phone?"*)\n` +
    `• Absences (e.g. *"Who is absent today?"*)\n` +
    `• Drafting parent communications and absence letters\n` +
    `• Lost & Found repository status and items`;
}
