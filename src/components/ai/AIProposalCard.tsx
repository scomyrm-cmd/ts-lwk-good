import React, { useState } from 'react';
import { Check, ClipboardCheck, LoaderCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AIProposal } from '../../types';
import { studentTools } from '../../i18n/studentTools';
import { WorkspaceDialog } from '../common/WorkspaceDialog';

export function ProposalReview({ proposal, onSaved }: { proposal: AIProposal; onSaved?: () => void }) {
  const { students, attendance, settings, requestStudentAI, t } = useApp();
  const copy = studentTools[settings.language];
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const labels: Record<string, string> = { studentId: copy.studentId, firstName: copy.firstName, lastName: copy.lastName, className: copy.className,
    classNumber: copy.classNumber, guardianEmail: t.guardianEmail, guardianPhone: t.guardianPhone, guardianContact: t.guardianContact,
    gender: t.gender, dateOfBirth: t.dateOfBirth, notes: t.notes };
  const apply = async () => {
    setBusy(true); setError('');
    try { await requestStudentAI('apply', { proposal, confirmed: true }); setSaved(true); onSaved?.(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Save failed'); }
    finally { setBusy(false); }
  };
  if (saved) return <div role="status" className="scan-success"><Check size={20} />{copy.saved}</div>;
  return <div className="space-y-4">
    <p className="text-sm text-slate-500 dark:text-slate-400">{copy.reviewHelp}</p>
    <div className="space-y-3">
      {proposal.studentChanges.map((change, i) => {
        const student = students.find(row => row.id === change.targetId);
        return <section className="scan-change" key={'student-' + i}>
          <h4 className="font-semibold mb-3">{student ? `${student.firstName} ${student.lastName} · ${student.studentId}` : copy.newStudent}</h4>
          <dl className="space-y-2">{Object.entries(change.fields).map(([key, value]) => <div className="scan-diff" key={key}>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{labels[key] || key}</dt>
            <dd className="min-w-0 break-words"><span className="block text-xs text-slate-500" aria-label={copy.before}>{student?.[key as keyof typeof student] || '—'}</span>
              <span className="font-medium" aria-label={copy.after} dir="auto">{value || '—'}</span></dd>
          </div>)}</dl>
        </section>;
      })}
      {proposal.attendanceChanges.map((change, i) => {
        const student = students.find(row => row.studentId === change.studentId);
        const old = attendance.find(row => row.studentId === change.studentId && row.date === change.date);
        return <section className="scan-change" key={'attendance-' + i}>
          <h4 className="font-semibold">{student ? `${student.firstName} ${student.lastName}` : change.studentId}</h4>
          <p className="text-sm mt-2">{change.studentId} · {change.date}</p>
          <p className="text-sm mt-1">{old ? copy[old.status] : '—'} → <strong>{copy[change.status]}</strong></p>
          {change.reason !== undefined && <p className="text-sm mt-1">{t.reason}: {old?.reason || '—'} → {change.reason || '—'}</p>}
          {change.notes !== undefined && <p className="text-sm mt-1">{t.notes}: {old?.notes || '—'} → {change.notes || '—'}</p>}
        </section>;
      })}
    </div>
    {proposal.attendanceChanges.some(row => row.status === 'absent' || row.status === 'late') && <p className="scan-notice">{copy.emailNotice}</p>}
    {error && <p role="alert" className="scan-error">{error}</p>}
    <button type="button" className="workspace-button workspace-button-primary w-full" disabled={busy} onClick={apply}>
      {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}{busy ? copy.applying : copy.apply}
    </button>
  </div>;
}

export function AIProposalCard({ proposal }: { proposal: AIProposal }) {
  const { settings } = useApp();
  const copy = studentTools[settings.language];
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  return <div className="mt-3 rounded-xl border border-brand-200 p-3 dark:border-brand-800">
    <p className="font-semibold text-sm">{saved ? copy.saved : copy.proposal}</p>
    {!saved && <><p className="text-xs my-2">{copy.studentEdits}: {proposal.studentChanges.length} · {copy.attendanceEdits}: {proposal.attendanceChanges.length}</p>
      <button type="button" className="workspace-button" onClick={() => setOpen(true)}><ClipboardCheck size={16} />{copy.review}</button></>}
    {open && <WorkspaceDialog label={copy.proposal} onClose={() => setOpen(false)} className="max-w-2xl">
      <div className="workspace-panel p-5 sm:p-7"><div className="flex items-center justify-between gap-4 mb-5"><h3 className="font-bold">{copy.proposal}</h3>
        <button type="button" className="workspace-icon-button" aria-label={copy.close} onClick={() => setOpen(false)}><X size={18} /></button></div>
        <ProposalReview proposal={proposal} onSaved={() => setSaved(true)} />
      </div></WorkspaceDialog>}
  </div>;
}
