import React, { useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, ScanLine, LoaderCircle, X, Trash2, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AIProposal, ScanRow } from '../../types';
import { studentTools } from '../../i18n/studentTools';
import { availableClasses, classLabel, latinDigits } from '../../utils/moroccanClasses';
import { WorkspaceDialog } from '../common/WorkspaceDialog';
import { ProposalReview } from './AIProposalCard';

async function readPhoto(file: File): Promise<{ data: string; mimeType: string; url: string; name?: string }> {
  if (/\.hei[cf]$/i.test(file.name) || /image\/hei[cf]/.test(file.type)) {
    if (file.size > 2_500_000) throw new Error('HEIC_LIMIT');
    const result = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    let url = result;
    try { const image = new Image(); image.src = url; await image.decode(); } catch { url = ''; }
    return { data: result.split(',')[1], mimeType: 'image/heic', url, name: file.name };
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    if (!image.width || !image.height || image.width * image.height > 65_000_000) throw new Error('Image dimensions are too large');
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 2400 / Math.max(image.width, image.height));
    canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing unavailable');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let result = canvas.toDataURL('image/jpeg', 0.88);
    if (result.length > 3_400_000) result = canvas.toDataURL('image/jpeg', 0.66);
    if (result.length > 3_400_000) throw new Error('Crop a smaller part of the document');
    return { data: result.split(',')[1], mimeType: 'image/jpeg', url: result };
  } finally { URL.revokeObjectURL(url); }
}

function ScannerDialog({ onClose, initialMode }: { onClose: () => void; initialMode: 'roster' | 'attendance' }) {
  const { settings, students, schoolInfo, requestStudentAI } = useApp();
  const copy = studentTools[settings.language];
  const [mode, setMode] = useState(initialMode);
  const [photo, setPhoto] = useState<Awaited<ReturnType<typeof readPhoto>>>();
  const [rows, setRows] = useState<ScanRow[] | null>(null);
  const [summary, setSummary] = useState('');
  const [hint, setHint] = useState('');
  const [startingNumber, setStartingNumber] = useState(1);
  const [format, setFormat] = useState<'weekly' | 'list'>('weekly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<AIProposal>();
  const [noChanges, setNoChanges] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null), cameraInput = useRef<HTMLInputElement>(null);
  const groups = availableClasses(students, schoolInfo.classGroups);
  const pick = async (file?: File) => {
    if (!file) return;
    setError(''); setRows(null); setProposal(undefined); setNoChanges(false); setSummary(''); setPhoto(undefined);
    if ((!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) && !/\.hei[cf]$/i.test(file.name)) || file.size > 15_000_000) { setError(copy.photoError); return; }
    setBusy(true);
    try { setPhoto(await readPhoto(file)); }
    catch (error) { setError(error instanceof Error && error.message === 'HEIC_LIMIT' ? copy.heicLimit : copy.readError); }
    finally { setBusy(false); }
  };
  const analyze = async () => {
    if (!photo) return;
    setBusy(true); setError('');
    try {
      const data = await requestStudentAI('scan', { image: { data: photo.data, mimeType: photo.mimeType }, mode, classHint: hint, startingNumber, format });
      setRows(data.rows ?? []);
      setSummary(data.summary ?? '');
    } catch (error) { setError(error instanceof Error ? error.message : copy.readError); }
    finally { setBusy(false); }
  };
  const preview = async () => {
    setBusy(true); setError('');
    try {
      const data = await requestStudentAI('preview', { rows, mode });
      if (data.proposal) setProposal(data.proposal); else setNoChanges(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Preview failed'); }
    finally { setBusy(false); }
  };
  const changeRow = (index: number, key: keyof ScanRow, value: string) => setRows(current => current?.map((row, i) => i === index ? { ...row, [key]: value } : row) ?? null);
  const identity = (value: string) => latinDigits(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const studentIndex = useMemo(() => {
    const ids = new Map<string, typeof students[number] | undefined>(), rolls = new Map<string, typeof students[number] | undefined>();
    for (const student of students) {
      const id = identity(student.studentId);
      ids.set(id, ids.has(id) ? undefined : student);
      if (student.classNumber) {
        const key = identity(student.className) + '/' + identity(student.classNumber).replace(/^0+(?=\d)/, '');
        rolls.set(key, rolls.has(key) ? undefined : student);
      }
    }
    return { ids, rolls };
  }, [students]);
  const matchStudent = (row: ScanRow) => row.studentId ? studentIndex.ids.get(identity(row.studentId)) :
    studentIndex.rolls.get(identity(row.className) + '/' + identity(row.classNumber).replace(/^0+(?=\d)/, ''));
  return <WorkspaceDialog label={copy.scan} onClose={onClose} className="max-w-5xl">
    <div className="workspace-panel p-4 sm:p-7">
      <header className="flex items-start justify-between gap-4 mb-5"><div><p className="text-xs font-semibold text-brand-600 dark:text-brand-300 mb-1">Campus AI · {copy.scan}</p>
        <h2 className="text-xl font-bold">{proposal ? copy.proposal : rows ? copy.rows : copy.scan}</h2></div>
        <button type="button" className="workspace-icon-button" aria-label={copy.close} onClick={onClose}><X size={20} /></button></header>
      {proposal ? <><button type="button" onClick={() => setProposal(undefined)} className="workspace-button mb-4"><ArrowLeft size={16} />{copy.rows}</button>
        <ProposalReview key={proposal.id} proposal={proposal} /></> : <>
        {!rows && <fieldset disabled={busy} className="space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">{copy.scanHelp}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="scan-label">{copy.mode}<select className="workspace-field" value={mode} onChange={event => setMode(event.target.value as typeof mode)}>
              <option value="roster">{copy.roster}</option><option value="attendance">{copy.attendance}</option></select></label>
            <label className="scan-label">{copy.optionalClass}<input className="workspace-field" value={hint} onChange={event => setHint(event.target.value)} placeholder={copy.autoClass} list="scan-class-hints" maxLength={120} /></label>
            <datalist id="scan-class-hints">{groups.map(group => <option key={group} value={group}>{classLabel(group, settings.language)}</option>)}</datalist>
            {mode === 'roster' ? <label className="scan-label">{copy.startingNumber}<input type="number" min={1} max={999} className="workspace-field" value={startingNumber} onChange={event => setStartingNumber(Number(event.target.value))} /></label> :
              <label className="scan-label">{copy.format}<select className="workspace-field" value={format} onChange={event => setFormat(event.target.value as typeof format)}><option value="weekly">{copy.weekly}</option><option value="list">{copy.namedList}</option></select></label>}
          </div>
          <p className="scan-notice">{mode === 'roster' ? copy.numberingHelp : format === 'weekly' ? copy.weeklyHelp : copy.matchingHelp}</p>
          <input ref={cameraInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" capture="environment" className="hidden" aria-label={copy.camera} onChange={event => { void pick(event.target.files?.[0]); event.target.value = ''; }} />
          <input ref={uploadInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="hidden" aria-label={copy.upload} onChange={event => { void pick(event.target.files?.[0]); event.target.value = ''; }} />
          <div className="scan-upload-area">
            {photo?.url ? <img src={photo.url} alt={copy.photo} className="max-h-64 max-w-full object-contain rounded-lg mx-auto mb-4" /> : <ScanLine size={36} className="mx-auto text-brand-500 mb-4" />}
            {photo && !photo.url && <p className="scan-notice mb-4">{photo.name} · {copy.heicPreview}</p>}
            <div className="flex flex-wrap justify-center gap-3"><button type="button" className="workspace-button workspace-button-primary" onClick={() => cameraInput.current?.click()}><Camera size={17} />{copy.camera}</button>
              <button type="button" className="workspace-button" onClick={() => uploadInput.current?.click()}><ImagePlus size={17} />{copy.upload}</button></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">{copy.crop}</p>
          </div>
          <p className="scan-notice">{copy.dataNotice}</p>
          <button type="button" disabled={!photo || busy} onClick={analyze} className="workspace-button workspace-button-primary w-full"><ScanLine size={17} />{copy.analyze}</button>
        </fieldset>}
        {rows && <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">{summary}</p>
          {photo?.url && <details className="scan-change"><summary className="cursor-pointer text-sm font-medium">{copy.photo}</summary><img src={photo.url} alt={copy.photo} className="mt-3 max-h-96 max-w-full mx-auto object-contain" /></details>}
          <p className="scan-notice">{mode === 'roster' ? copy.generatedId : copy.matchingHelp}</p>
          {!rows.length && <p role="status" className="scan-notice">{copy.empty}</p>}
          <div className="scan-rows">{rows.map((row, index) => <fieldset key={index} disabled={busy || noChanges} className="scan-row">
            <div className="flex justify-between items-center gap-2 mb-3"><span className="text-xs font-semibold text-brand-600 dark:text-brand-300">{index + 1} · {row.className || copy.className}</span>
              <button type="button" aria-label={`${copy.remove} ${index + 1}`} className="workspace-icon-button" onClick={() => setRows(current => current?.filter((_, i) => i !== index) ?? null)}><Trash2 size={15} /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(mode === 'attendance' && format === 'weekly' ? ['className', 'classNumber'] as const : ['firstName', 'lastName', 'studentId', 'className', 'classNumber'] as const).map(key => <label key={key} className="scan-label">{copy[key]}
                <input className="workspace-field" dir="auto" value={row[key]} maxLength={key === 'classNumber' ? 20 : 120} list={key === 'className' ? 'scan-class-options' : undefined}
                  onChange={event => changeRow(index, key, event.target.value)} /></label>)}
              {mode === 'attendance' && <><label className="scan-label">{copy.date}<input type="date" className="workspace-field" value={row.date} onChange={event => changeRow(index, 'date', event.target.value)} /></label>
                <label className="scan-label">{copy.scope}<select className="workspace-field" value={row.scope || 'day'} onChange={event => { changeRow(index, 'scope', event.target.value); if (event.target.value === 'day') changeRow(index, 'period', ''); }} disabled={format === 'weekly'}><option value="day">{copy.day}</option><option value="lesson">{copy.lesson}</option></select></label>
                {row.scope === 'lesson' && <label className="scan-label">{copy.period}<input dir="ltr" className="workspace-field" placeholder="08:00-09:00" maxLength={20} value={row.period || ''} onChange={event => changeRow(index, 'period', event.target.value)} /></label>}
                <label className="scan-label">{copy.status}<select className="workspace-field" value={row.status} onChange={event => changeRow(index, 'status', event.target.value)}>
                  <option value="">{copy.choose}</option>{(['present', 'absent', 'late', 'excused'] as const).map(status => <option key={status} value={status}>{copy[status]}</option>)}</select></label></>}
            </div>
            {mode === 'attendance' && <p className="text-sm mt-3" dir="auto">{matchStudent(row) ? `${copy.matched}: ${matchStudent(row)!.firstName} ${matchStudent(row)!.lastName}` : copy.unmatched}</p>}
            {row.warning && <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">{copy.uncertain}: {row.warning}</p>}
          </fieldset>)}</div>
          <datalist id="scan-class-options">{groups.map(group => <option value={group} key={group} />)}</datalist>
          {noChanges ? <p className="scan-success" role="status">{copy.noChanges}</p> : <button type="button" disabled={busy || !rows.length} onClick={preview} className="workspace-button workspace-button-primary w-full">{copy.review}</button>}
          <button type="button" disabled={busy} className="workspace-button" onClick={() => { setRows(null); setNoChanges(false); setError(''); }}>{copy.clear}</button>
        </div>}
      </>}
      {busy && <p className="flex items-center gap-2 mt-4 text-sm" role="status"><LoaderCircle size={17} className="animate-spin" />{copy.analyzing}</p>}
      {error && <p className="scan-error mt-4" role="alert">{error}</p>}
    </div>
  </WorkspaceDialog>;
}

export function DocumentScanner({ mode = 'roster', compact = false }: { mode?: 'roster' | 'attendance'; compact?: boolean }) {
  const { settings } = useApp();
  const [open, setOpen] = useState(false);
  const copy = studentTools[settings.language];
  if (!settings.aiAssistant.enabled) return null;
  return <><button type="button" className={compact ? 'workspace-icon-button' : 'workspace-button'} title={copy.scan} aria-label={copy.scan} onClick={() => setOpen(true)}>
    <Camera size={17} />{!compact && <span>{copy.scan}</span>}</button>
    {open && <ScannerDialog initialMode={mode} onClose={() => setOpen(false)} />}</>;
}
