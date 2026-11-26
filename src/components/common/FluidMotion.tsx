import { useEffect, useRef, type ReactNode } from 'react';
import { animate, motion, useReducedMotion } from 'motion/react';

// A shared, critically damped response for controls and surfaces.
export const fluidSpring = { type: 'spring', bounce: 0, visualDuration: 0.32 } as const;

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={{ opacity: 0, y: reduced ? 0 : 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={reduced ? { duration: 0.12 } : { ...fluidSpring, delay }}>{children}</motion.div>;
}

/** Native dialogs retain their focus trap, Escape handling and return focus. */
export function useDialogMotion(open: boolean, horizontal = false, onClosed?: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const closedRef = useRef(onClosed);
  closedRef.current = onClosed;

  useEffect(() => {
    const dialog = ref.current;
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const direction = document.documentElement.dir === 'rtl' ? 1 : -1;
    const offset = horizontal ? { x: direction * 32 } : { y: 16, scale: 0.98 };
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.style.opacity = '0';
      if (!reduced) dialog.style.transform = horizontal ? `translateX(${direction * 32}px)` : 'translateY(16px) scale(0.98)';
    }
    if (!dialog.open) return;
    // Retarget the current presentation value when an interaction reverses.
    const animation = animate(dialog, open ? { opacity: 1, x: 0, y: 0, scale: 1 } : { opacity: 0, ...(reduced ? {} : offset) }, reduced ? { duration: 0.12 } : fluidSpring);
    if (!open) animation.then(() => { dialog.close(); closedRef.current?.(); });
    return () => animation.stop();
  }, [open, horizontal, reduced]);

  return ref;
}
