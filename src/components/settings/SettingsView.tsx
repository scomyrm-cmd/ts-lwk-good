import React, { useEffect, useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Globe,
  Bell,
  User,
  School,
  Shield,
  Sparkles,
  Upload,
  Trash2,
  Save,
  Check,
  RefreshCw,
  Database,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkspaceHeader } from '../common/WorkspaceUI';
import { Language, ThemeMode, DateFormat, TimeFormat } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settingsSubTab,
    setSettingsSubTab,
    adminProfile,
    updateAdminProfile,
    schoolInfo,
    updateSchoolInfo,
    settings,
    updateSettings,
    seedDemoData,
    clearAllSchoolData,
    clearAllConversations,
    changePassword,
    t,
  } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [configuredModel, setConfiguredModel] = useState<string | null>(null);

  useEffect(() => {
    if (settingsSubTab !== 'ai-settings') return;
    const request = new AbortController();
    void fetch('/api/campus-ai', { signal: request.signal, cache: 'no-store' }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      if (!request.signal.aborted) setConfiguredModel(data.configured ? data.model : null);
    }).catch(() => {});
    return () => request.abort();
  }, [settingsSubTab]);

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChangingPassword(true);
    setPasswordNotice(null);
    const result = await changePassword(currentPassword, nextPassword);
    setChangingPassword(false);
    setPasswordNotice({
      ok: result.success,
      message: result.success ? 'Password updated. Other sessions were signed out.' : result.error || 'Password update failed.',
    });
    if (result.success) {
      setCurrentPassword('');
      setNextPassword('');
    }
  };

  // Local form states
  const [profileDisplayName, setProfileDisplayName] = useState(adminProfile.displayName);
  const [profilePictureUrl, setProfilePictureUrl] = useState(adminProfile.profilePictureUrl || '');

  const [schoolName, setSchoolName] = useState(schoolInfo.name);
  const [schoolAddress, setSchoolAddress] = useState(schoolInfo.address);
  const [schoolCity, setSchoolCity] = useState(schoolInfo.city);
  const [schoolCountry, setSchoolCountry] = useState(schoolInfo.country);
  const [schoolEmail, setSchoolEmail] = useState(schoolInfo.email);
  const [schoolPhone, setSchoolPhone] = useState(schoolInfo.phone);
  const [schoolWebsite, setSchoolWebsite] = useState(schoolInfo.website);

  const [notifState, setNotifState] = useState(settings.notifications);

  // Profile Picture File Upload with Compression
  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize the image before saving it to the server.
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setProfilePictureUrl(compressedDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile({
      displayName: profileDisplayName.trim(),
      profilePictureUrl: profilePictureUrl || undefined,
    });
  };

  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolInfo({
      name: schoolName.trim(),
      address: schoolAddress.trim(),
      city: schoolCity.trim(),
      country: schoolCountry.trim(),
      email: schoolEmail.trim(),
      phone: schoolPhone.trim(),
      website: schoolWebsite.trim(),
    });
  };

  const handleSaveNotifications = () => {
    updateSettings({ notifications: notifState });
  };

  const tabs = [
    { id: 'admin-profile', label: t.tabAdminProfile, icon: User },
    { id: 'general', label: t.tabGeneral, icon: Settings },
    { id: 'appearance', label: t.tabAppearance, icon: Sun },
    { id: 'language-region', label: t.tabLanguageRegion, icon: Globe },
    { id: 'notifications', label: t.tabNotifications, icon: Bell },
    { id: 'school-info', label: t.tabSchoolInfo, icon: School },
    { id: 'security', label: t.tabSecurity, icon: Shield },
    { id: 'ai-settings', label: t.tabAISettings, icon: Sparkles },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="workspace-page">
      <WorkspaceHeader title={t.settingsTitle} description={t.settingsSubtitle} />

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[12.5rem_minmax(0,1fr)]">
        {/* Settings Navigation Sidebar */}
        <nav className="workspace-panel flex gap-1 overflow-x-auto p-1.5 xl:flex-col" aria-label={t.settingsTitle}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = settingsSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSettingsSubTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-start text-sm font-medium whitespace-nowrap transition-colors xl:w-full ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings Content Pane */}
        <div className="workspace-panel p-4 sm:p-6">
          {/* TAB: ADMINISTRATOR PROFILE */}
          {settingsSubTab === 'admin-profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.adminProfileTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize your personal administrative credentials and photo
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Profile Photo Upload */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border-2 border-slate-300 dark:border-slate-600 shadow-xs">
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                        {getInitials(profileDisplayName)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                      {t.profilePicture}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t.changePhoto}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      {profilePictureUrl && (
                        <button
                          type="button"
                          onClick={() => setProfilePictureUrl('')}
                          className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          {t.removePhoto}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      PNG, JPG, or JPEG. Scaled down to prevent storage limits.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.displayName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileDisplayName}
                      onChange={(e) => setProfileDisplayName(e.target.value)}
                      placeholder="e.g. Islam Nour Bouya"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.username} (Demo Login)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={adminProfile.username}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.adminRole}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={adminProfile.role}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm cursor-not-allowed"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs md:text-sm rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t.saveChanges}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: GENERAL */}
          {settingsSubTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  System Data Management
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage demo data seed state and reset school records
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Database State Management
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Campus OS is initialized with a clean state. For demonstration, evaluation, or testing, you can populate or clear test records instantly.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={seedDemoData}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    <span>Populate 20 Sample Records</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearAllSchoolData}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Records (Clean State)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: APPEARANCE */}
          {settingsSubTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.tabAppearance}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your preferred interface color theme
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'light' as ThemeMode, label: t.lightTheme, icon: Sun, desc: 'Light surfaces and soft borders' },
                  { id: 'dark' as ThemeMode, label: t.darkTheme, icon: Moon, desc: 'Deep navy surfaces' },
                  { id: 'system' as ThemeMode, label: t.systemTheme, icon: Laptop, desc: 'Match your device theme' },
                ].map((th) => {
                  const Icon = th.icon;
                  const isSelected = settings.theme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => updateSettings({ theme: th.id })}
                      aria-pressed={isSelected}
                      className={`p-4 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                      </div>
                      <div>
                        <span className="font-semibold text-xs md:text-sm text-slate-900 dark:text-slate-100 block">
                          {th.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                          {th.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: LANGUAGE & REGION */}
          {settingsSubTab === 'language-region' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.tabLanguageRegion}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure language, RTL layout, time zones, and date formatting
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    {t.preferredLanguage}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { code: 'en' as Language, label: 'English (US / UK)', sub: 'Default Left-to-Right' },
                      { code: 'fr' as Language, label: 'Français (Maroc)', sub: 'Environnement scolaire' },
                      { code: 'ar' as Language, label: 'العربية (المغرب)', sub: 'تنسيق كامل من اليمين لليسار (RTL)' },
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => updateSettings({ language: item.code })}
                        className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                          settings.language === item.code
                            ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                      >
                        <span className="font-bold text-xs md:text-sm block">{item.label}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                          {item.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.dateFormat}
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => updateSettings({ dateFormat: e.target.value as DateFormat })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Moroccan Standard)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.timeZone}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={settings.timeZone}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {settingsSubTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.tabNotifications}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose which events generate administrative alerts
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'absence' as const, label: 'Absence & Truancy Alerts', desc: 'Trigger in-app notification when a student is recorded absent or late.' },
                  { key: 'newLost' as const, label: 'New Lost Item Reports', desc: 'Notify administrators when a missing item is reported by a student or guardian.' },
                  { key: 'newFound' as const, label: 'New Found Item Logged', desc: 'Notify when staff or students turn in an item to the office.' },
                  { key: 'claimed' as const, label: 'Item Claim & Release Confirmations', desc: 'Alert when an item is collected and claimed.' },
                  { key: 'activity' as const, label: 'Administrative Action Logs', desc: 'Notify on major structural changes (new students registered or deleted).' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifState[item.key]}
                        onChange={(e) => {
                          const updated = { ...notifState, [item.key]: e.target.checked };
                          setNotifState(updated);
                          updateSettings({ notifications: updated });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SCHOOL INFORMATION */}
          {settingsSubTab === 'school-info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.tabSchoolInfo}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your educational institution branding, contact, and official address
                </p>
              </div>

              <form onSubmit={handleSaveSchoolInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.schoolName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.schoolCity}
                    </label>
                    <input
                      type="text"
                      value={schoolCity}
                      onChange={(e) => setSchoolCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.schoolCountry}
                    </label>
                    <input
                      type="text"
                      value={schoolCountry}
                      onChange={(e) => setSchoolCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.schoolAddress}
                  </label>
                  <input
                    type="text"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.schoolEmail}
                    </label>
                    <input
                      type="email"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      {t.schoolPhone}
                    </label>
                    <input
                      type="text"
                      value={schoolPhone}
                      onChange={(e) => setSchoolPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs md:text-sm rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t.saveChanges}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: SECURITY */}
          {settingsSubTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.tabSecurity}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage the password for this administrator account.
                </p>
              </div>

              <form className="grid max-w-md gap-4" onSubmit={savePassword}>
                <div>
                  <label className="auth-label" htmlFor="current-admin-password">Current password</label>
                  <input id="current-admin-password" type="password" autoComplete="current-password" className="workspace-field" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                </div>
                <div>
                  <label className="auth-label" htmlFor="next-admin-password">New password</label>
                  <input id="next-admin-password" type="password" autoComplete="new-password" className="workspace-field" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} minLength={14} required />
                  <p className="mt-1 text-xs text-slate-500">{t.adminPasswordHint}</p>
                </div>
                {passwordNotice && (
                  <p role={passwordNotice.ok ? 'status' : 'alert'} className={passwordNotice.ok ? 'text-sm text-brand-700 dark:text-brand-300' : 'text-sm text-red-700 dark:text-red-300'}>
                    {passwordNotice.message}
                  </p>
                )}
                <button type="submit" className="workspace-button workspace-button-primary justify-self-start" disabled={changingPassword}>
                  <Lock size={16} aria-hidden="true" />
                  {changingPassword ? t.loading : 'Update password'}
                </button>
              </form>
            </div>
          )}

          {/* TAB: AI ASSISTANT SETTINGS */}
          {settingsSubTab === 'ai-settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Campus AI Configuration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage access to Campus AI and saved conversation history.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Enable Campus AI Assistant
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Expose the conversational AI tool in the main navigation
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.aiAssistant.enabled}
                    onChange={(e) =>
                      updateSettings({
                        aiAssistant: { ...settings.aiAssistant, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Student data privacy
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Campus OS reads student records on the server. Gemini receives selected attendance statistics with known identifiers removed.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Always Enforced
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Gemini Model
                    </label>
                    <input
                      type="text"
                      disabled
                      value={configuredModel || 'Unavailable'}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      API Gateway
                    </label>
                    <input
                      type="text"
                      disabled
                      value="/api/campus-ai"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
                  Save conversation history
                  <input
                    type="checkbox"
                    checked={settings.aiAssistant.saveHistory}
                    onChange={(event) => updateSettings({
                      aiAssistant: { ...settings.aiAssistant, saveHistory: event.target.checked },
                    })}
                  />
                </label>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Reset local conversation cache
                  </span>
                  <button
                    type="button"
                    onClick={clearAllConversations}
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear AI Chat History
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
