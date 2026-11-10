import React, { useState } from 'react';
import { History, Filter, Search, Trash2, Calendar, User, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkspaceHeader } from '../common/WorkspaceUI';
import { ActivityActionType } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';

export const ActivityLogView: React.FC = () => {
  const { activities, clearActivityHistory, t } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const filteredActivities = activities.filter((act) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      act.description.toLowerCase().includes(q) ||
      act.administrator.toLowerCase().includes(q) ||
      act.actionType.toLowerCase().includes(q);

    const matchesAction =
      filterAction === 'all' || act.actionType === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (type: ActivityActionType) => {
    switch (type) {
      case 'student_created':
      case 'found_item_reported':
      case 'item_claimed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400';
      case 'student_deleted':
      case 'absence_recorded':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400';
      case 'student_edited':
      case 'attendance_updated':
      case 'lost_item_reported':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400';
      default:
        return 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400';
    }
  };

  return (
    <div className="workspace-page">
      <WorkspaceHeader title={t.activityTitle} description={t.activitySubtitle}>
        {activities.length > 0 && (
          <button
            type="button"
            onClick={() => setIsConfirmClearOpen(true)}
            className="workspace-button hover:text-red-700 dark:hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearActivity}</span>
          </button>
        )}
      </WorkspaceHeader>

      {/* Main Content Area */}
      {activities.length === 0 ? (
        <div className="workspace-panel">
          <EmptyState icon={History} title={t.noActivityTitle} description={t.noActivityDesc} />
        </div>
      ) : (
        <div className="workspace-panel overflow-hidden">
          {/* Controls Bar */}
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-3 dark:border-slate-800 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by description or admin..."
                className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Action Types</option>
                <option value="student_created">Student Created</option>
                <option value="student_edited">Student Edited</option>
                <option value="student_deleted">Student Deleted</option>
                <option value="attendance_updated">Attendance Updated</option>
                <option value="absence_recorded">Absence Recorded</option>
                <option value="lost_item_reported">Lost Item Reported</option>
                <option value="found_item_reported">Found Item Reported</option>
                <option value="item_claimed">Item Claimed</option>
                <option value="item_archived">Item Archived</option>
                <option value="settings_updated">Settings Updated</option>
              </select>
            </div>
          </div>

          {/* Table / List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No activity logs match your filter criteria.
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getActionBadgeColor(
                            act.actionType
                          )}`}
                        >
                          {act.actionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{act.administrator}</span>
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1 leading-relaxed">
                        {act.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 shrink-0 sm:text-end">
                    <p>{new Date(act.timestamp).toLocaleDateString()}</p>
                    <p>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Clear Confirmation */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title="Clear Activity Audit Trail"
        message="Are you sure you want to clear the entire administrative action log? This action cannot be undone."
        confirmLabel="Clear Log"
        isDestructive={true}
        onConfirm={() => {
          clearActivityHistory();
          setIsConfirmClearOpen(false);
        }}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
};
