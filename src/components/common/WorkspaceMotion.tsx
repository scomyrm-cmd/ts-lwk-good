import { useEffect, useMemo } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';

/** Animate only a small numeric text node; the accessible value stays stable. */
export function AnimatedNumber({ value, language }: { value: number; language: string }) {
  const reducedMotion = useReducedMotion();
  const counter = useMotionValue(0);
  const number = useMemo(() => new Intl.NumberFormat(language), [language]);
  const formatted = useTransform(counter, (latest) => number.format(Math.round(latest)));

  useEffect(() => {
    if (reducedMotion) {
      counter.set(value);
      return;
    }
    const animation = animate(counter, value, { duration: 0.85, ease: [0.22, 1, 0.36, 1] });
    return () => animation.stop();
  }, [value, counter, reducedMotion]);

  return (
    <span aria-label={number.format(value)}>
      <motion.span aria-hidden="true">{formatted}</motion.span>
    </span>
  );
}
