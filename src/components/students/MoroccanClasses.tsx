import React, { useId, useState } from 'react';
import { GraduationCap, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { studentTools } from '../../i18n/studentTools';
import { availableClasses, classLabel, MOROCCAN_LEVELS } from '../../utils/moroccanClasses';
import { WorkspaceDialog } from '../common/WorkspaceDialog';

export function ClassPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { students, schoolInfo, settings } = useApp();
  const id = useId();
  return <><input aria-label={studentTools[settings.language].className} required maxLength={120} list={id} value={value} onChange={event => onChange(event.target.value)} className="workspace-field" placeholder="2AC-3" />
    <datalist id={id}>{availableClasses(students, schoolInfo.classGroups).map(group => <option value={group} key={group}>{classLabel(group, settings.language)}</option>)}</datalist></>;
}

export function MoroccanClassGroups() {
  const { students, schoolInfo, settings, updateSchoolInfo, showToast } = useApp();
  const copy = studentTools[settings.language];
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState('2AC');
  const [section, setSection] = useState('1');
  const [branch, setBranch] = useState('');
  const groups = availableClasses(students, schoolInfo.classGroups);
  const upper = ['TC', '1BAC', '2BAC'].includes(level);
  const className = `${level}${upper && branch.trim() ? '-' + branch.trim() : ''}-${section}`;
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[1-9]\d{0,2}$/.test(section) || className.length > 120 || groups.length >= 300) return;
    updateSchoolInfo({ classGroups: [...new Set([...groups, className])] });
    showToast(copy.groupSaved);
  };
  return <><button type="button" className="workspace-button" onClick={() => setOpen(true)}><GraduationCap size={17} />{copy.groups}</button>
    {open && <WorkspaceDialog label={copy.groups} onClose={() => setOpen(false)} className="max-w-2xl"><div className="workspace-panel p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3 mb-4"><h2 className="font-bold text-lg">{copy.groups}</h2><button type="button" className="workspace-icon-button" aria-label={copy.close} onClick={() => setOpen(false)}><X size={18} /></button></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{copy.groupHelp}</p>
      <form onSubmit={add} className="grid sm:grid-cols-2 gap-3 mb-6">
        <label className="scan-label">{copy.level}<select value={level} onChange={event => setLevel(event.target.value)} className="workspace-field">
          {MOROCCAN_LEVELS.map(item => <option value={item.code} key={item.code}>{item[settings.language]}</option>)}</select></label>
        <label className="scan-label">{copy.section}<input type="number" min="1" max="999" required className="workspace-field" value={section} onChange={event => setSection(event.target.value)} /></label>
        {upper && <label className="scan-label sm:col-span-2">{copy.branch}<input className="workspace-field" maxLength={80} value={branch} onChange={event => setBranch(event.target.value)} placeholder="Sciences physiques" /></label>}
        <button type="submit" className="workspace-button workspace-button-primary sm:col-span-2"><Plus size={16} />{copy.addGroup} · {className}</button>
      </form>
      <div className="grid sm:grid-cols-2 gap-2">{groups.map(group => {
        const count = students.filter(student => student.className === group).length;
        return <div key={group} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
          <div className="min-w-0"><p className="font-semibold text-sm break-words">{group}</p><p className="text-xs text-slate-500 dark:text-slate-400">{classLabel(group, settings.language)} · {count}</p></div>
          {!count && <button type="button" className="workspace-icon-button shrink-0" aria-label={`${copy.removeGroup} ${group}`} onClick={() => updateSchoolInfo({ classGroups: groups.filter(value => value !== group) })}><Trash2 size={14} /></button>}
        </div>;
      })}</div>
    </div></WorkspaceDialog>}
  </>;
}
