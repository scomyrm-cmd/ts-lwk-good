import { useState, type ReactNode } from 'react';
import { useDialogMotion } from './FluidMotion';

export function WorkspaceDialog({
  label,
  onClose,
  className = '',
  children,
}: {
  label: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const ref = useDialogMotion(open, false, onClose);

  return (
    <dialog
      ref={ref}
      className={`workspace-dialog ${className}`}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      {children}
    </dialog>
  );
}
