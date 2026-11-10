import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, PackageSearch, UserCheck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkspaceDialog } from '../common/WorkspaceDialog';

export const GlobalSearchModal: React.FC = () => {
  const {
    globalSearchOpen,
    setGlobalSearchOpen,
    students,
    lostFoundItems,
    attendance,
    setActiveTab,
    t,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [globalSearchOpen]);

  if (!globalSearchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedStudents = trimmed
    ? students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(trimmed) ||
          s.lastName.toLowerCase().includes(trimmed) ||
          s.studentId.toLowerCase().includes(trimmed) ||
          s.className.toLowerCase().includes(trimmed)
      )
    : [];

  const matchedItems = trimmed
    ? lostFoundItems.filter(
        (i) =>
          i.itemName.toLowerCase().includes(trimmed) ||
          i.category.toLowerCase().includes(trimmed) ||
          i.location.toLowerCase().includes(trimmed) ||
          i.description.toLowerCase().includes(trimmed)
      )
    : [];

  const matchedAttendance = trimmed
    ? attendance
        .filter(
          (a) =>
            a.studentId.toLowerCase().includes(trimmed) ||
            a.reason?.toLowerCase().includes(trimmed) ||
            a.status.toLowerCase().includes(trimmed)
        )
        .slice(0, 5)
    : [];

  const hasResults =
    matchedStudents.length > 0 ||
    matchedItems.length > 0 ||
    matchedAttendance.length > 0;

  return (
    <WorkspaceDialog label={t.search} onClose={() => setGlobalSearchOpen(false)} className="max-w-2xl">
      <div className="workspace-panel">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.globalSearchPlaceholder}
            className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {!trimmed && (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              Type student name, ID, class, or lost item to search across Campus OS.
            </div>
          )}

          {trimmed && !hasResults && (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {matchedStudents.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{t.navStudents} ({matchedStudents.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveTab('students');
                      setGlobalSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-start transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {s.studentId} · {s.className}
                      </p>
                    </div>
                    <span className="text-[10px] bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded font-medium">
                      Student
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedItems.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <PackageSearch className="w-3.5 h-3.5" />
                <span>{t.navLostFound} ({matchedItems.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab('lostfound');
                      setGlobalSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-start transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {item.itemName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.category} · {item.location}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase ${
                        item.status === 'claimed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedAttendance.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t.navAttendance} ({matchedAttendance.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedAttendance.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => {
                      setActiveTab('attendance');
                      setGlobalSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-start transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        ID: {rec.studentId}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {rec.date} · {rec.reason || 'Regular status'}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {rec.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </WorkspaceDialog>
  );
};
