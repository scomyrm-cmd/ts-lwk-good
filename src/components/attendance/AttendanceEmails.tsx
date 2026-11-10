import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

type Notice = {
  id: string; studentId: string; studentName: string; date: string; attendanceStatus: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'uncertain' | 'cancelled'; error?: string;
};

const copy = {
  en: { title: 'Guardian email notices', ready: 'Notifications enabled', disabled: 'Email notifications are not configured', empty: 'No notices for this date', retry: 'Retry', confirm: 'Check EmailJS history first. If this message was already sent, retrying could send a duplicate. Continue?', pending: 'Queued', sending: 'Sending', sent: 'Sent', failed: 'Failed', uncertain: 'Check delivery', cancelled: 'Cancelled' },
  fr: { title: 'Notifications aux responsables', ready: 'Notifications activées', disabled: 'Les notifications email ne sont pas configurées', empty: 'Aucun message pour cette date', retry: 'Réessayer', confirm: 'Vérifiez d’abord l’historique EmailJS. Si le message a déjà été envoyé, une nouvelle tentative peut créer un doublon. Continuer ?', pending: 'En attente', sending: 'Envoi en cours', sent: 'Envoyé', failed: 'Échec', uncertain: 'Vérifier l’envoi', cancelled: 'Annulé' },
  ar: { title: 'إشعارات أولياء الأمور', ready: 'الإشعارات مفعّلة', disabled: 'إشعارات البريد الإلكتروني غير مهيأة', empty: 'لا توجد إشعارات لهذا التاريخ', retry: 'إعادة المحاولة', confirm: 'تحقق أولاً من سجل EmailJS. قد تؤدي إعادة المحاولة إلى إرسال نسخة مكررة إذا تم إرسال الرسالة بالفعل. هل تريد المتابعة؟', pending: 'في الانتظار', sending: 'جارٍ الإرسال', sent: 'تم الإرسال', failed: 'فشل', uncertain: 'تحقق من الإرسال', cancelled: 'ملغى' },
};

export function AttendanceEmails() {
  const { currentDate, settings } = useApp();
  const text = copy[settings.language];
  const [notices, setNotices] = useState<Notice[]>([]);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/admin/attendance-emails', { cache: 'no-store', credentials: 'include', signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Email status could not be loaded');
        if (controller.signal.aborted) return;
        setNotices(data.notifications);
        setConfigured(data.configured);
        setError('');
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Email status could not be loaded');
      }
    }
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [refresh]);

  async function retry(notice: Notice) {
    if (notice.status === 'uncertain' && !window.confirm(text.confirm)) return;
    setBusy(notice.id);
    try {
      const response = await fetch('/api/admin/attendance-emails', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: notice.studentId, date: notice.date, retry: true, confirmed: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Email retry failed');
      setRefresh((value) => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : 'Email retry failed'); }
    finally { setBusy(''); }
  }

  const visible = notices.filter((notice) => notice.date === currentDate);
  return (
    <details className="workspace-panel px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium">{text.title} · {visible.filter((notice) => notice.status === 'sent').length} {text.sent.toLowerCase()}</summary>
      <div className="mt-3 space-y-3 text-sm" aria-live="polite">
        <p className="text-slate-500">{configured ? text.ready : text.disabled}</p>
        {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
        {!visible.length && <p>{text.empty}</p>}
        {visible.map((notice) => (
          <div key={notice.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <div><span className="font-medium">{notice.studentName}</span> · {notice.attendanceStatus === 'late' ? 'Retard' : 'Absence'} · <span>{text[notice.status]}</span>
              {notice.error && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{notice.error}</p>}
            </div>
            {(notice.status === 'failed' || notice.status === 'uncertain') && <button type="button" className="workspace-button" disabled={busy === notice.id} onClick={() => void retry(notice)}>{text.retry}</button>}
          </div>
        ))}
      </div>
    </details>
  );
}
