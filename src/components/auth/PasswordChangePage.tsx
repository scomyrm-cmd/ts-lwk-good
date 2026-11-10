import { useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusBrand, LanguageControl } from '../common/WorkspaceUI';

const text = {
  en: {
    title: 'Choose your administrator password',
    description: 'Your account uses a temporary password. Choose a private password with at least 14 characters to finish signing in.',
    current: 'Temporary password', next: 'New password', confirm: 'Confirm new password', submit: 'Save password and continue',
  },
  fr: {
    title: 'Choisissez votre mot de passe administrateur',
    description: 'Votre compte utilise un mot de passe temporaire. Choisissez un mot de passe privé de 14 caractères minimum pour terminer la connexion.',
    current: 'Mot de passe temporaire', next: 'Nouveau mot de passe', confirm: 'Confirmer le nouveau mot de passe', submit: 'Enregistrer et continuer',
  },
  ar: {
    title: 'اختر كلمة مرور المسؤول',
    description: 'يستخدم حسابك كلمة مرور مؤقتة. اختر كلمة مرور خاصة من 14 حرفاً على الأقل لإكمال تسجيل الدخول.',
    current: 'كلمة المرور المؤقتة', next: 'كلمة المرور الجديدة', confirm: 'تأكيد كلمة المرور الجديدة', submit: 'حفظ كلمة المرور والمتابعة',
  },
};

export function PasswordChangePage() {
  const { changePassword, logout, settings, t } = useApp();
  const copy = text[settings.language];
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setError(t.passwordMismatch);
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await changePassword(currentPassword, password);
      if (!result.success) setError(result.error || t.loginError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <CampusBrand />
        <LanguageControl />
      </header>
      <main className="mx-auto w-full max-w-md px-5 py-12 sm:py-20">
        <h1 className="auth-heading">{copy.title}</h1>
        <p className="auth-description mb-7">{copy.description}</p>
        <form onSubmit={submit} className="grid gap-5" aria-busy={busy}>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>}
          <div>
            <label className="auth-label" htmlFor="temporary-password">{copy.current}</label>
            <input id="temporary-password" className="workspace-field" type="password" autoComplete="current-password" required maxLength={72} disabled={busy} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          </div>
          <div>
            <label className="auth-label" htmlFor="private-password">{copy.next}</label>
            <input id="private-password" className="workspace-field" type="password" autoComplete="new-password" required minLength={14} maxLength={72} disabled={busy} value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div>
            <label className="auth-label" htmlFor="confirm-private-password">{copy.confirm}</label>
            <input id="confirm-private-password" className="workspace-field" type="password" autoComplete="new-password" required minLength={14} maxLength={72} disabled={busy} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </div>
          <button className="workspace-button workspace-button-primary justify-center" type="submit" disabled={busy}>{busy ? t.loading : copy.submit}</button>
          <button className="workspace-button justify-center" type="button" disabled={busy} onClick={logout}>{t.logout}</button>
        </form>
      </main>
    </div>
  );
}
