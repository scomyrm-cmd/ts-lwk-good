import React, { useState, useEffect } from 'react';
import {
  PackageSearch,
  Search,
  Filter,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Shield,
  User,
  Globe,
  Tag,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LostFoundItem, ItemCategory } from '../../types';
import { Language } from '../../types';

export const UserPortalView: React.FC = () => {
  const {
    currentUser,
    logout,
    lostFoundItems,
    userReports,
    fetchUserReports,
    submitUserReport,
    settings,
    updateSettings,
    openAIChat,
    t,
    schoolInfo,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'report' | 'my-reports' | 'ai'>('catalog');

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
    fetchUserReports();
  }, []);

  const handleLanguageChange = (lang: Language) => {
    updateSettings({ language: lang });
  };

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 px-4 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-tight text-slate-900 dark:text-slate-100">
              {t.appName}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {schoolInfo.name} · {t.normalUserPortal}
            </p>
          </div>
        </div>

        {/* Right actions: Language, User Profile, Logout */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                settings.language === 'en'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('fr')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                settings.language === 'fr'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('ar')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                settings.language === 'ar'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              العربية
            </button>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold">{currentUser?.displayName || currentUser?.username}</span>
            <span className="text-[10px] text-slate-400 border border-slate-300 dark:border-slate-700 rounded-full px-1.5">
              Normal User
            </span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8">
        <div className="flex items-center gap-2 overflow-x-auto max-w-6xl mx-auto py-2">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <PackageSearch className="w-4 h-4" />
            <span>{t.lostFoundCatalog}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'report'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.submitReport}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'my-reports'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t.myReports}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {userReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Campus AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
        {/* TAB 1: CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Header & Search */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.lostFoundCatalog}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Search and inspect items reported on school grounds. If you recognize your property, click for details to claim it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('report')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Lost / Found Item</span>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute start-3 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by item name, room, or description..."
                    className="w-full ps-9 pe-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Item Statuses</option>
                  <option value="lost">Lost Items (Reported Missing)</option>
                  <option value="found">Found Items (Available at Office)</option>
                </select>
              </div>
            </div>

            {/* Item Cards Grid */}
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <PackageSearch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  No matching items found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Try adjusting your search criteria, or submit a new report if you lost something recently.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all"
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
                          {item.reportType === 'found' ? 'Found Item' : 'Lost Item'}
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
                      className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details & Claim Info</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUBMIT REPORT */}
        {activeTab === 'report' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t.submitReport}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Provide accurate details about your lost or found item. Administration staff review each report and notify you upon verification.
              </p>
            </div>

            {submitSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
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
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-3 text-xs text-red-800 dark:text-red-300">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <span>Submit Official Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: MY SUBMITTED REPORTS */}
        {activeTab === 'my-reports' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.myReports}
                </h2>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Track status updates from campus administration for your submitted tickets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + New Report
              </button>
            </div>

            {userReports.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  You haven't submitted any reports yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  If you lost or found something on campus, submit a report and administration staff will assist you.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('report')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit a Report</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                        <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
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
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
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

        {/* TAB 4: CAMPUS AI ASSISTANT FOR STUDENTS */}
        {activeTab === 'ai' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Campus AI Assistant
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Ask questions about lost & found items, school calendar, locations on campus, or school guidelines in English, French, Arabic, or Moroccan Darija.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => openAIChat('How do I claim a lost item on campus?')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Launch Assistant Consultation</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Item Details Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
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

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
