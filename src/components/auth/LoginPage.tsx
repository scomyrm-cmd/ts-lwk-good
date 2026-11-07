import React, { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  AlertCircle,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';

type AuthMode = 'user-login' | 'user-register' | 'admin-login';

export const LoginPage: React.FC = () => {
  const { login, register, t, schoolInfo, settings, updateSettings } = useApp();

  const [mode, setMode] = useState<AuthMode>('user-login');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Switch modes cleanly
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    if (newMode === 'admin-login') {
      setUsername('islamnourbouya');
      setPassword('islamoss1980');
    } else if (newMode === 'user-login') {
      setUsername('student_user');
      setPassword('user123');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleLanguageChange = (lang: Language) => {
    updateSettings({ language: lang });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'user-register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }

        const res = await register(username.trim(), email.trim(), password, displayName.trim());
        if (!res.success) {
          setError(res.error || 'Registration failed. Please check your details.');
        }
      } else {
        // Login mode (either admin or normal user)
        const isAdminLogin = mode === 'admin-login';
        const res = await login(username.trim(), password, isAdminLogin);

        if (!res.success) {
          setError(res.error || t.loginError);
        }
      }
    } catch (err: any) {
      setError(err.message || t.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = mode === 'admin-login';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors relative selection:bg-blue-500 selection:text-white">
      {/* Top Bar with Language Selector */}
      <header className="absolute top-4 end-4 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400 ms-1.5" />
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              settings.language === 'en'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('fr')}
            className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              settings.language === 'fr'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('ar')}
            className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              settings.language === 'ar'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            العربية
          </button>
        </div>
      </header>

      <div className="w-full max-w-md my-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-lg mb-3 transition-all ${
              isAdmin
                ? 'bg-gradient-to-tr from-indigo-700 to-blue-600 shadow-indigo-500/25 ring-4 ring-indigo-100 dark:ring-indigo-950/50'
                : 'bg-gradient-to-tr from-blue-600 to-sky-500 shadow-blue-500/20'
            }`}
          >
            {isAdmin ? <Shield className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center justify-center gap-2">
            <span>{t.appName}</span>
            {isAdmin && (
              <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Admin
              </span>
            )}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {schoolInfo.name} · {isAdmin ? t.adminPortal : t.normalUserPortal}
          </p>
        </div>

        {/* Mode Switcher Tabs for Normal User vs Admin Portal */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => switchMode('user-login')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              !isAdmin
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-300'
            }`}
          >
            {t.userLoginBtn}
          </button>

          <button
            type="button"
            data-testid="admin-login-tab-btn"
            onClick={() => switchMode('admin-login')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isAdmin
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.adminLoginBtn}</span>
          </button>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Admin Banner Alert */}
          {isAdmin && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">{t.adminAccessOnly}</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Full administrative permissions. Student data export and management enabled.
                </p>
              </div>
            </div>
          )}

          {/* Form Header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {mode === 'user-register'
                  ? t.registerTitle
                  : isAdmin
                  ? t.adminPortal
                  : t.userLoginBtn}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === 'user-register'
                  ? 'Access Lost & Found catalog and submit item reports'
                  : isAdmin
                  ? 'Enter verified administrative credentials'
                  : 'Enter student, parent, or staff account details'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Display Name for Registration */}
            {mode === 'user-register' && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                >
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email for Registration */}
            {mode === 'user-register' && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campus-os.edu"
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
              >
                {t.username}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isAdmin ? 'islamnourbouya' : 'student_user'}
                  className="w-full ps-10 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-10 pe-11 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register mode) */}
            {mode === 'user-register' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Remember Me */}
            {mode !== 'user-register' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-slate-600 dark:text-slate-400">{t.rememberMe}</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-white font-semibold text-sm rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70 cursor-pointer ${
                isAdmin
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.loading}</span>
                </>
              ) : (
                <span>
                  {mode === 'user-register'
                    ? t.registerBtn
                    : isAdmin
                    ? 'Enter Admin Portal'
                    : t.loginButton}
                </span>
              )}
            </button>
          </form>

          {/* Toggle between Register and Login for Normal Users */}
          {!isAdmin && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              {mode === 'user-login' ? (
                <button
                  type="button"
                  onClick={() => switchMode('user-register')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                >
                  {t.needAccount}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('user-login')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                >
                  {t.alreadyHaveAccount}
                </button>
              )}
            </div>
          )}

          {/* Demo Helper Credentials */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAdmin ? (
                <span>
                  Admin Demo: <strong>islamnourbouya</strong> / <strong>islamoss1980</strong>
                </span>
              ) : (
                <span>
                  User Demo: <strong>student_user</strong> / <strong>user123</strong>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Campus OS Secure Education Portal · Role-Based Access Control Active
        </p>
      </div>
    </div>
  );
};
