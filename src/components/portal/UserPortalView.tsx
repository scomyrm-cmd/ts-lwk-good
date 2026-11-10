import React, { useState, useEffect } from 'react';
import {
  PackageSearch,
  Search,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Tag,
  MapPin,
  Calendar,
  Eye,
  Info,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { LostFoundItem, ItemCategory } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { WorkspaceDialog } from '../common/WorkspaceDialog';
import { CampusBrand, LanguageControl, WorkspaceAvatar, WorkspaceHeader } from '../common/WorkspaceUI';

type PortalTab = 'catalog' | 'report' | 'my-reports';

export const UserPortalView: React.FC = () => {
  const {
    currentUser,
    logout,
    lostFoundItems,
    userReports,
    fetchUserReports,
    fetchLostFoundFromServer,
    submitUserReport,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<PortalTab>('catalog');

  // Catalog search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewItem, setViewItem] = useState<LostFoundItem | null>(null);

  // Report form state
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost');
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<ItemCategory>('Accessories');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDescription, setReportDescription] = useState('');
  const [reportContact, setReportContact] = useState(currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const request = new AbortController();
    void fetchUserReports();
    void fetchLostFoundFromServer(request.signal);
    return () => request.abort();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!reportTitle.trim() || !reportLocation.trim()) {
      setSubmitError('Please enter an item name and location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitUserReport({
        type: reportType,
        title: reportTitle.trim(),
        category: reportCategory,
        description: reportDescription.trim(),
        location: reportLocation.trim(),
        date: reportDate,
        contact: reportContact.trim(),
      });

      if (res.success) {
        setSubmitSuccess(true);
        setReportTitle('');
        setReportDescription('');
        setReportLocation('');
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab('my-reports');
        }, 1500);
      } else {
        setSubmitError(res.error || 'Failed to submit report.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter public lost & found items
  const filteredItems = lostFoundItems.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    const matchesType =
      selectedType === 'all' || item.reportType === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const tabs = [
    { id: 'catalog', label: t.lostFoundCatalog, icon: PackageSearch },
    { id: 'report', label: t.submitReport, icon: PlusCircle },
    { id: 'my-reports', label: t.myReports, icon: FileText },
  ] as const;

  const userName = currentUser?.displayName || currentUser?.username || '';

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="workspace-topbar portal-content border-0">
          <CampusBrand caption={t.normalUserPortal} />
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <LanguageControl />
            <div className="hidden items-center gap-2 sm:flex">
              <WorkspaceAvatar name={userName} />
              <span className="hidden max-w-32 truncate text-sm font-medium md:inline">{userName}</span>
            </div>
            <button type="button" className="workspace-icon-button" onClick={logout} aria-label={t.logout} title={t.logout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <nav className="portal-content workspace-tabs portal-tabs border-0" aria-label={t.normalUserPortal}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="workspace-tab"
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <main className="portal-content flex-1 pt-7 pb-24 md:pt-10">
        {/* TAB 1: CATALOG */}
        {activeTab === 'catalog' && (
          <div className="workspace-page">
            <WorkspaceHeader title={t.lostFoundCatalog} description={t.portalCatalogDescription}>
              <button type="button" onClick={() => setActiveTab('report')} className="workspace-button workspace-button-primary">
                <PlusCircle size={16} /> {t.submitReport}
              </button>
            </WorkspaceHeader>

            <div className="workspace-panel grid gap-3 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="relative">
                <Search className="w-4 h-4 absolute start-3 inset-y-0 my-auto text-slate-400 pointer-events-none" />
                <input
                  aria-label={t.search}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search}
                  className="workspace-field ps-9"
                />
              </div>

              <select
                aria-label={t.category}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="workspace-field"
              >
                <option value="all">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Bags">Bags & Backpacks</option>
                <option value="Books">Books & Textbooks</option>
                <option value="School Supplies">School Supplies</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
              </select>

              <select
                aria-label={t.status}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="workspace-field"
              >
                <option value="all">All Item Statuses</option>
                <option value="lost">{t.lostItems}</option>
                <option value="found">{t.foundItems}</option>
              </select>
            </div>

            {/* Item Cards Grid */}
            {filteredItems.length === 0 ? (
              <div className="workspace-panel">
                <EmptyState
                  icon={PackageSearch}
                  title={lostFoundItems.length ? t.noMatchingItems : t.noItemsTitle}
                  description={lostFoundItems.length ? t.adjustFilters : t.noItemsDesc}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="workspace-panel flex flex-col justify-between p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            item.reportType === 'found'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {item.reportType === 'found' ? t.foundItems : t.lostItems}
                        </span>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.dateReported}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.itemName}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {item.description || 'No detailed description provided.'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewItem(item)}
                      className="workspace-link mt-4 self-start"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.view}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUBMIT REPORT */}
        {activeTab === 'report' && (
          <div className="workspace-page max-w-3xl">
            <WorkspaceHeader title={t.submitReport} description={t.portalReportDescription} />
            <div className="workspace-panel p-4 sm:p-6">
              {submitSuccess && (
                <div role="status" className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold">Report successfully submitted!</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Redirecting to your submitted reports...
                    </p>
                  </div>
                </div>
              )}

              {submitError && (
                <div role="alert" className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-3 text-xs text-red-800 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleReportSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Report Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReportType('lost')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        reportType === 'lost'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      I Lost an Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('found')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        reportType === 'found'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      I Found an Item
                    </button>
                  </div>
                </div>

                {/* Item Title */}
                <div>
                  <label
                    htmlFor="reportTitle"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Item Name / Title *
                  </label>
                  <input
                    id="reportTitle"
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. Blue Water Bottle, Casio fx-991 Calculator"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Category and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reportCategory"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                    >
                      Category *
                    </label>
                    <select
                      id="reportCategory"
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value as ItemCategory)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Bags">Bags</option>
                      <option value="Books">Books</option>
                      <option value="School Supplies">School Supplies</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="reportDate"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                    >
                      Date Incident Occurred *
                    </label>
                    <input
                      id="reportDate"
                      type="date"
                      required
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="reportLocation"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Campus Location / Room *
                  </label>
                  <input
                    id="reportLocation"
                    type="text"
                    required
                    value={reportLocation}
                    onChange={(e) => setReportLocation(e.target.value)}
                    placeholder="e.g. Science Lab 3, Cafeteria courtyard bench"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="reportDescription"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Detailed Description & Identifying Marks
                  </label>
                  <textarea
                    id="reportDescription"
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Color, brand, size, distinctive stickers, scratches, or contents..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Contact Information */}
                <div>
                  <label
                    htmlFor="reportContact"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Contact Phone or Email for Claim Follow-up
                  </label>
                  <input
                    id="reportContact"
                    type="text"
                    value={reportContact}
                    onChange={(e) => setReportContact(e.target.value)}
                    placeholder="+212 600-000000 or email"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Report...</span>
                      </>
                    ) : (
                      <span>{t.submitReport}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: MY SUBMITTED REPORTS */}
        {activeTab === 'my-reports' && (
          <div className="workspace-page">
            <WorkspaceHeader title={t.myReports} description={t.portalReportsDescription}>
              <button type="button" onClick={() => setActiveTab('report')} className="workspace-button workspace-button-primary">
                <PlusCircle size={16} /> {t.submitReport}
              </button>
            </WorkspaceHeader>

            {userReports.length === 0 ? (
              <div className="workspace-panel">
                <EmptyState icon={FileText} title={t.noPersonalReports} description={t.portalReportDescription} />
              </div>
            ) : (
              <div className="workspace-panel divide-y divide-slate-200 dark:divide-slate-800">
                {userReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            report.type === 'found'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {report.type}
                        </span>

                        <span className="text-xs text-slate-400">
                          Ticket #{report.id.slice(-6).toUpperCase()}
                        </span>

                        <span className="text-xs text-slate-400">·</span>

                        <span className="text-xs text-slate-400">
                          {report.date}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {report.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        Location: {report.location} · Category: {report.category}
                      </p>

                      {report.adminNotes && (
                        <div className="mt-2 p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/40 text-xs text-brand-900 dark:text-brand-200 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-600" />
                          <span>Admin Note: {report.adminNotes}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          report.status === 'resolved' || report.status === 'claimed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : report.status === 'reviewed'
                            ? 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {report.status === 'resolved' || report.status === 'claimed'
                          ? 'Resolved & Claimed'
                          : report.status === 'reviewed'
                          ? 'Verified by Admin'
                          : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Item Details Modal */}
      {viewItem && (
        <WorkspaceDialog label={viewItem.itemName} onClose={() => setViewItem(null)} className="max-w-lg">
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    viewItem.reportType === 'found'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {viewItem.reportType === 'found' ? 'Found Item' : 'Lost Item'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {viewItem.itemName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="workspace-icon-button"
                aria-label={t.close}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Category:</strong> {viewItem.category}
              </p>
              <p>
                <strong>Location:</strong> {viewItem.location}
              </p>
              <p>
                <strong>Date Reported:</strong> {viewItem.dateReported}
              </p>
              <p>
                <strong>Status:</strong> {viewItem.status.toUpperCase()}
              </p>
              {viewItem.description && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mt-2">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description:
                  </p>
                  <p>{viewItem.description}</p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/40 text-xs text-brand-900 dark:text-brand-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" />
              <div>
                <p className="font-semibold">How to claim this item:</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Visit the Administration Reception desk with your Student ID card. A staff member will verify your description or locker details before releasing the item.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="workspace-button"
              >
                {t.close}
              </button>
            </div>
          </div>
        </WorkspaceDialog>
      )}
    </div>
  );
};
