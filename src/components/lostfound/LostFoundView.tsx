import React, { useState } from 'react';
import {
  PackageSearch,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Archive,
  Trash2,
  Edit,
  Eye,
  MapPin,
  Calendar,
  User,
  ArrowUpDown,
  Tag,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  Check,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MetricStrip, WorkspaceHeader } from '../common/WorkspaceUI';
import { LostFoundItem, ItemCategory, ItemStatus } from '../../types';
import { calculateLostFoundStats, formatDateWithPattern } from '../../utils/analytics';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { ItemModal } from './ItemModal';
import { ClaimModal } from './ClaimModal';

export const LostFoundView: React.FC = () => {
  const {
    lostFoundItems,
    deleteLostFoundItem,
    archiveItem,
    userReports,
    fetchAdminReports,
    fetchLostFoundFromServer,
    updateAdminReportStatus,
    settings,
    t,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'student-reports'>('catalog');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'lost' | 'found'>('found');
  const [itemToEdit, setItemToEdit] = useState<LostFoundItem | null>(null);
  const [itemToClaim, setItemToClaim] = useState<LostFoundItem | null>(null);
  const [itemToView, setItemToView] = useState<LostFoundItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<LostFoundItem | null>(null);

  const stats = calculateLostFoundStats(lostFoundItems);

  const categories: ItemCategory[] = [
    'Electronics',
    'Clothing',
    'Bags',
    'Books',
    'Accessories',
    'School Supplies',
    'Other',
  ];

  // Filtering & Sorting
  const filteredItems = lostFoundItems
    .filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        item.itemName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.dateReported).getTime();
      const dateB = new Date(b.dateReported).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const metrics = [
    { label: t.totalReported, value: stats.totalReported, icon: PackageSearch },
    { label: t.lostItems, value: stats.lostCount, icon: Search },
    { label: t.foundItems, value: stats.foundCount, icon: Archive },
    { label: t.claimedItems, value: stats.claimedCount, icon: CheckCircle },
  ];
  const pendingReports = userReports.filter((report) => report.status === 'pending').length;

  return (
    <div className="workspace-page">
      <WorkspaceHeader title={t.lostFoundTitle} description={t.lostFoundSubtitle}>
        <button
          type="button"
          onClick={async () => {
            setIsRefreshing(true);
            await Promise.all([fetchAdminReports(), fetchLostFoundFromServer()]);
            setTimeout(() => setIsRefreshing(false), 500);
          }}
          disabled={isRefreshing}
          className="workspace-button"
          title="Synchronize student reports and inventory with server database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Server'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setItemToEdit(null);
            setReportType('lost');
            setIsReportModalOpen(true);
          }}
          className="workspace-button"
        >
          <Plus className="w-4 h-4" />
          <span>{t.reportLostItem}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setItemToEdit(null);
            setReportType('found');
            setIsReportModalOpen(true);
          }}
          className="workspace-button workspace-button-primary"
        >
          <Plus className="w-4 h-4" />
          <span>{t.reportFoundItem}</span>
        </button>
      </WorkspaceHeader>

      <nav className="workspace-tabs" aria-label={t.lostFoundTitle}>
        <button type="button" className="workspace-tab" aria-current={activeSubTab === 'catalog' ? 'page' : undefined} onClick={() => setActiveSubTab('catalog')}>
          <PackageSearch size={16} aria-hidden="true" />
          {t.officialCatalog}
        </button>
        <button type="button" className="workspace-tab" aria-current={activeSubTab === 'student-reports' ? 'page' : undefined} onClick={() => setActiveSubTab('student-reports')}>
          <FileText size={16} aria-hidden="true" />
          {t.studentReports}
          {pendingReports > 0 && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <span className="sr-only">{t.reportsAwaitingReview} </span>
              {pendingReports}
            </span>
          )}
        </button>
      </nav>

      {activeSubTab === 'catalog' && <MetricStrip items={metrics} />}

      {/* Main Content Area */}
      {activeSubTab === 'catalog' && (
        <>
          {lostFoundItems.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={t.noItemsTitle}
          description={t.noItemsDesc}
          actionButton={{
            label: t.reportFoundItem,
            onClick: () => {
              setItemToEdit(null);
              setReportType('found');
              setIsReportModalOpen(true);
            },
            icon: Plus,
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filter */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items by name, location, keyword..."
                className="w-full ps-9 pe-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="found">Found (Unclaimed)</option>
                <option value="lost">Lost</option>
                <option value="claimed">Claimed</option>
                <option value="archived">Archived</option>
              </select>

              {/* Sort Order */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                title="Toggle Sort Order"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
              </button>

              <span className="text-xs text-slate-400">
                {filteredItems.length} items
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
              No lost & found items found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="workspace-item-card workspace-panel overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div>
                    {/* Image / Header bar */}
                    {item.imageUrl ? (
                      <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 end-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-md shadow-xs ${
                              item.status === 'claimed'
                                ? 'bg-emerald-600/90 text-white'
                                : item.status === 'lost'
                                ? 'bg-rose-600/90 text-white'
                                : 'bg-amber-600/90 text-white'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{item.category}</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.status === 'claimed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : item.status === 'lost'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {item.itemName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description || 'No detailed description provided.'}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateWithPattern(item.dateReported, settings.dateFormat)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Reported by: {item.reporterName}</span>
                        </div>
                      </div>

                      {item.status === 'claimed' && (
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                            Claimed by {item.claimedBy}
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            On {item.claimedAt} {item.claimNotes ? `· ${item.claimNotes}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setItemToView(item)}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.view} Details</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {item.status !== 'claimed' && item.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => setItemToClaim(item)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        >
                          {t.markAsClaimed}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setItemToEdit(item);
                          setIsReportModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                        title={t.edit}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {item.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => archiveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                          title={t.archiveItem}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Sub-tab 2: Student Incident Reports */}
      {activeSubTab === 'student-reports' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Student Submitted Reports ({userReports.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Incidents and missing items submitted live from the student portal
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                setIsRefreshing(true);
                await fetchAdminReports();
                setTimeout(() => setIsRefreshing(false), 400);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:bg-brand-100 cursor-pointer w-fit"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Reports</span>
            </button>
          </div>

          {userReports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No student reports submitted yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When students report missing or found items in the Student Portal, they will appear here in real-time for administrative review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header Tags */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                            report.type === 'lost'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {report.type === 'lost' ? 'Lost Item Report' : 'Found Item Report'}
                        </span>
                        <span className="text-xs text-slate-400">· {report.category}</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          report.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : report.status === 'reviewed'
                            ? 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {report.title}
                    </h3>

                    {/* Student Info Box */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Student / Reporter:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {report.userName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          {report.userEmail}
                        </span>
                      </div>
                      {report.contact && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Contact / Phone:</span>
                          <span className="font-semibold text-brand-600 dark:text-brand-400">
                            {report.contact}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Location & Date */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{report.date}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100/80 dark:border-slate-800/80">
                      {report.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">
                      ID: {report.id.substring(0, 14)}
                    </span>

                    <div className="flex items-center gap-2">
                      {report.status !== 'reviewed' && report.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => updateAdminReportStatus(report.id, 'reviewed')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white cursor-pointer transition-colors"
                        >
                          Mark Reviewed
                        </button>
                      )}

                      {report.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => updateAdminReportStatus(report.id, 'resolved')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => updateAdminReportStatus(report.id, 'reviewed', undefined, true)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                        title="Ensure item is in official catalog inventory"
                      >
                        Add to Official Catalog
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Item Modal (Create/Edit) */}
      <ItemModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setItemToEdit(null);
        }}
        reportType={reportType}
        itemToEdit={itemToEdit}
      />

      {/* Claim Modal */}
      <ClaimModal
        isOpen={Boolean(itemToClaim)}
        onClose={() => setItemToClaim(null)}
        item={itemToClaim}
      />

      {/* Item Details View Modal */}
      {itemToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {itemToView.itemName}
                </h3>
                <span className="text-xs text-slate-400">
                  {itemToView.category} · {itemToView.reportType.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setItemToView(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {itemToView.imageUrl && (
                <img
                  src={itemToView.imageUrl}
                  alt={itemToView.itemName}
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Description
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  {itemToView.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {itemToView.location}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block text-[11px]">Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateWithPattern(itemToView.dateReported, settings.dateFormat)}
                  </span>
                </div>
              </div>

              {itemToView.status === 'claimed' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Claim Verification Record
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-400">
                    Claimed by: {itemToView.claimedBy} on {itemToView.claimedAt}
                  </p>
                  {itemToView.claimedStudentId && (
                    <p className="text-emerald-600 dark:text-emerald-400">
                      Student ID: {itemToView.claimedStudentId}
                    </p>
                  )}
                  {itemToView.claimNotes && (
                    <p className="text-emerald-600 dark:text-emerald-400 mt-1">
                      Notes: {itemToView.claimNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Delete Item Record"
        message={`Are you sure you want to permanently delete "${itemToDelete?.itemName}" from the Lost & Found inventory?`}
        confirmLabel={t.delete}
        isDestructive={true}
        onConfirm={() => {
          if (itemToDelete) {
            deleteLostFoundItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
