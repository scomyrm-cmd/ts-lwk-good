import React, { useState, useMemo } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Shield,
  User,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  X,
  AlertTriangle,
  Lock,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MetricStrip, WorkspaceHeader } from '../common/WorkspaceUI';
import { WorkspaceDialog } from '../common/WorkspaceDialog';
import { AuthUser, UserRole } from '../../types';

export const UserManagementView: React.FC = () => {
  const {
    users,
    createAdminUser,
    deleteAdminUser,
    currentUser,
    t,
    fetchAdminUsers,
    settings,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdminUsers();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const resetForm = () => {
    setDisplayName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('user');
    setShowPassword(false);
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (username.trim().length < 3) {
      setFormError('Username must contain at least 3 characters.');
      return;
    }

    if (password.length < 10) {
      setFormError('Password must contain at least 10 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await createAdminUser({
      displayName: displayName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      role,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error || 'Failed to create user account.');
      return;
    }

    resetForm();
    setIsCreateModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    await deleteAdminUser(userToDelete.id);
    setUserToDelete(null);
  };

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Statistics
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  const isRtl = settings.language === 'ar';

  return (
    <div className="space-y-6">
      <WorkspaceHeader title={t.usersTitle} description={t.usersSubtitle}>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="workspace-button"
          title="Refresh user list"
          aria-label="Refresh user list"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="workspace-button workspace-button-primary"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addUser}</span>
        </button>
      </WorkspaceHeader>

      <MetricStrip items={[
        { label: t.totalAccounts, value: totalCount, icon: User },
        { label: t.userRoleAdmin, value: adminCount, icon: Shield },
        { label: t.userRoleUser, value: userCount, icon: UserCog },
      ]} />

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="w-full ps-10 pe-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            aria-pressed={roleFilter === 'all'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.all} ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            aria-pressed={roleFilter === 'admin'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              roleFilter === 'admin'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.userRoleAdmin} ({adminCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('user')}
            aria-pressed={roleFilter === 'user'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              roleFilter === 'user'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.userRoleUser} ({userCount})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="workspace-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5 text-start">User / Account</th>
                <th className="px-5 py-3.5 text-start">Email Address</th>
                <th className="px-5 py-3.5 text-start">Role & Permissions</th>
                <th className="px-5 py-3.5 text-start">Created</th>
                <th className="px-5 py-3.5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <UserCog className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No user accounts found matching your query.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Username */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isAdmin
                                ? 'bg-brand-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {u.displayName
                              ? u.displayName.slice(0, 2).toUpperCase()
                              : u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{u.displayName || u.username}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 font-bold px-1.5 py-0.5 rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs">{u.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(u.email, u.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                            title="Copy email"
                          >
                            {copiedId === u.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-900/40">
                            <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                            <span>{t.userRoleAdmin}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{t.userRoleUser}</span>
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : 'System Seed'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => setUserToDelete(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50'
                            }`}
                            title={
                              isCurrent
                                ? 'Cannot delete your own active account'
                                : 'Delete user account'
                            }
                            aria-label={`Delete account for ${u.username}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <WorkspaceDialog label={t.addUser} onClose={() => setIsCreateModalOpen(false)} className="max-w-lg">
          <div>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <UserCog className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.addUser}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create credentials and assign permissions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label={t.close}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="create-user-name" className="auth-label">
                  {t.fullName} <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-user-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="workspace-field"
                />
              </div>

              {/* Username & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="create-user-username" className="auth-label">
                    {t.username} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="create-user-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="workspace-field"
                  />
                </div>
                <div>
                  <label htmlFor="create-user-email" className="auth-label">
                    {t.emailAddress} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="create-user-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="workspace-field"
                  />
                </div>
              </div>

              {/* Password with generator & show/hide */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="create-user-password" className="auth-label">
                    {t.passwordLabel} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{t.generatePassword}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="create-user-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={10}
                    maxLength={200}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordMinLength}
                    className="workspace-field pe-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? t.hidePasswordLabel : t.showPasswordLabel}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Account Role & Permissions <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
                      role === 'user'
                        ? 'bg-emerald-50/70 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 dark:text-slate-100">
                        <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{t.userRoleUser}</span>
                      </div>
                      <input
                        type="radio"
                        name="accountRole"
                        checked={role === 'user'}
                        onChange={() => setRole('user')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Access to Student Portal, Lost & Found catalog, ticket submissions.
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
                      role === 'admin'
                        ? 'bg-brand-50/70 border-brand-400 dark:bg-brand-950/40 dark:border-brand-600'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 dark:text-slate-100">
                        <Shield className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        <span>{t.userRoleAdmin}</span>
                      </div>
                      <input
                        type="radio"
                        name="accountRole"
                        checked={role === 'admin'}
                        onChange={() => setRole('admin')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Full access to administration dashboard, student registries, and Excel export.
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save & Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </WorkspaceDialog>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete Account ({userToDelete.username})?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t.confirmDeleteUser}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
