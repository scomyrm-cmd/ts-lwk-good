import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({ icon: Icon, title, description, actionButton }: EmptyStateProps) {
  return (
    <div className="workspace-empty">
      <div className="workspace-empty-icon"><Icon size={21} aria-hidden="true" /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionButton && (
        <button type="button" onClick={actionButton.onClick} className="workspace-button mt-2">
          {actionButton.icon && <actionButton.icon size={16} aria-hidden="true" />}
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
