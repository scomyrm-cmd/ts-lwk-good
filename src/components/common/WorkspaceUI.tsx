import type { CSSProperties, ReactNode } from 'react';
import { Globe, type LucideIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Language } from '../../types';

export function CampusBrand({ caption }: { caption?: string }) {
  const { t } = useApp();

  return (
    <div className="brand-lockup">
      <img src="/campus-mark.svg" width="36" height="36" alt="" />
      <div className="min-w-0">
        <div className="brand-name">{t.appName}</div>
        {caption && <div className="brand-caption" title={caption}>{caption}</div>}
      </div>
    </div>
  );
}

export function WorkspaceAvatar({ name, photo }: { name: string; photo?: string }) {
  const initials = (name || '').trim().split(/\s+/).slice(0, 2)
    .map((part) => Array.from(part)[0]).join('').toLocaleUpperCase();

  return (
    <span className="workspace-avatar" aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : initials || 'AD'}
    </span>
  );
}

export function LanguageControl() {
  const { settings, updateSettings, t } = useApp();

  return (
    <label className="language-control">
      <Globe aria-hidden="true" size={15} />
      <span className="sr-only">{t.preferredLanguage}</span>
      <select
        value={settings.language}
        onChange={(event) => updateSettings({ language: event.target.value as Language })}
      >
        <option value="en" lang="en">EN</option>
        <option value="fr" lang="fr">FR</option>
        <option value="ar" lang="ar">العربية</option>
      </select>
    </label>
  );
}

export function WorkspaceHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="workspace-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function MetricStrip({ items }: {
  items: ReadonlyArray<{ label: string; value: number; icon?: LucideIcon }>;
}) {
  const { settings } = useApp();
  const number = new Intl.NumberFormat(settings.language);

  return (
    <dl className="workspace-panel workspace-metrics" style={{ '--metric-count': items.length } as CSSProperties}>
      {items.map(({ label, value, icon: Icon }) => (
        <div className="workspace-metric" key={label}>
          <dt className="metric-label">
            {label}
            {Icon && <Icon size={17} strokeWidth={1.75} aria-hidden="true" />}
          </dt>
          <dd className="metric-value">{number.format(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
