import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, GraduationCap, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CampusBrand, LanguageControl } from '../common/WorkspaceUI';

type AuthMode = 'user-login' | 'user-register' | 'admin-login';

function CampusIllustration() {
  return (
    <svg aria-hidden="true" className="auth-illustration" viewBox="0 0 470 225" fill="none">
      <g stroke="currentColor" strokeWidth="1">
        <path opacity=".42" d="M1 223h468M1 198h468M1 173h468M1 148h468M1 123h468M1 98h468M1 73h468M1 48h468M1 23h468M22 8v216M72 8v216M122 8v216M172 8v216M222 8v216M272 8v216M322 8v216M372 8v216M422 8v216"/>
        <path d="M23 198h424M41 190h388M57 190v-66h75m281 66v-66h-75M44 124h88m206 0h88M132 190V85h206v105M121 85h228L235 28 121 85ZM140 92h190M150 104v71m17-71v71m26-71v71m17-71v71m50-71v71m17-71v71m26-71v71m17-71v71M140 104h190m-190 71h190M132 181h206m-206 9h206"/>
        <path d="M73 174v-28h14v28m15 0v-28h14v28m238 0v-28h14v28m15 0v-28h14v28M225 175v-35a10 10 0 0 1 20 0v35"/>
        <circle cx="235" cy="61" r="9"/>
      </g>
      <path d="M121 85 235 28l114 57M121 85h228" stroke="#8ad7c8" strokeWidth="1.4" />
      <path d="M22 198h51m324 0h50" stroke="#8ad7c8" />
    </svg>
  );
}

export function LoginPage() {
  const { login, register, t } = useApp();
  const [mode, setMode] = useState<AuthMode>('user-login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = mode === 'admin-login';
  const isRegistering = mode === 'user-register';

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setUsername('');
    setEmail('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isRegistering && password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    const fallback = isRegistering ? t.registrationError : t.loginError;
    setIsLoading(true);

    try {
      const result = isRegistering
        ? await register(username.trim(), email.trim(), password, displayName.trim())
        : await login(username.trim(), password, isAdmin);
      if (!result.success) setError(result.error || fallback);
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-editorial">
        <CampusBrand />
        <div className="auth-editorial-content">
          <h2>{t.workspaceTitle}</h2>
          <p className="auth-editorial-description">{t.workspaceDescription}</p>
        </div>
        <CampusIllustration />
      </aside>

      <div className="auth-main">
        <header className="auth-topbar">
          <CampusBrand caption={t.workspaceLabel} />
          <LanguageControl />
        </header>

        <main className="auth-content">
          <div className="auth-form">
            <h1 className="auth-heading">{isRegistering ? t.registerTitle : isAdmin ? t.adminPortal : t.loginTitle}</h1>
            <p className="auth-description">
              {isRegistering ? t.registerDescription : isAdmin ? t.adminSignInDescription : t.signInDescription}
            </p>

            <div className="auth-modes">
              <button type="button" disabled={isLoading} aria-pressed={!isAdmin} onClick={() => switchMode('user-login')}>
                <GraduationCap size={17} aria-hidden="true" className="shrink-0" />
                {t.userLoginBtn}
              </button>
              <button
                type="button"
                data-testid="admin-login-tab-btn"
                disabled={isLoading}
                aria-pressed={isAdmin}
                onClick={() => switchMode('admin-login')}
              >
                <ShieldCheck size={16} aria-hidden="true" className="shrink-0" />
                {t.adminLoginBtn}
              </button>
            </div>

            <form onSubmit={handleSubmit} aria-busy={isLoading} className="grid gap-4">
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  <AlertCircle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
                  {error}
                </div>
              )}

              {isRegistering && (
                <>
                  <div>
                    <label className="auth-label" htmlFor="displayName">{t.fullName}</label>
                    <input className="workspace-field" id="displayName" type="text" autoComplete="name" maxLength={120} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                  </div>
                  <div>
                    <label className="auth-label" htmlFor="email">{t.emailAddress}</label>
                    <input className="workspace-field" id="email" type="email" autoComplete="email" maxLength={160} required value={email} onChange={(event) => setEmail(event.target.value)} />
                  </div>
                </>
              )}

              <div>
                <label className="auth-label" htmlFor="username">{isRegistering ? t.username : t.loginIdentity}</label>
                <input
                  className="workspace-field"
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={isRegistering ? 70 : 100}
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>

              <div>
                <label className="auth-label" htmlFor="password">{t.passwordLabel}</label>
                <div className="relative">
                  <input
                    className="workspace-field pe-12"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    aria-describedby={isRegistering ? 'password-guidance' : undefined}
                    minLength={isRegistering ? 10 : undefined}
                    maxLength={200}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="workspace-icon-button absolute inset-y-0 end-1 my-auto"
                    aria-label={showPassword ? t.hidePasswordLabel : t.showPasswordLabel}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {isRegistering && <p id="password-guidance" className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.passwordMinLength}</p>}
              </div>

              {isRegistering && (
                <div>
                  <label className="auth-label" htmlFor="confirmPassword">{t.confirmPasswordLabel}</label>
                  <input
                    className="workspace-field"
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              )}

              <button type="submit" disabled={isLoading} className="workspace-button workspace-button-primary mt-1 min-h-11">
                {isLoading ? t.loading : isRegistering ? t.registerBtn : t.loginButton}
                {isLoading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} className="rtl:rotate-180" />}
              </button>
            </form>

            {!isAdmin && (
              <div className="auth-footer">
                <button
                  type="button"
                  disabled={isLoading}
                  className="workspace-link"
                  onClick={() => switchMode(isRegistering ? 'user-login' : 'user-register')}
                >
                  {isRegistering ? t.alreadyHaveAccount : t.needAccount}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
