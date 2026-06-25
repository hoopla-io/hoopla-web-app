import { useEffect, useRef, useState } from "react";

/**
 * Smoothly counts a number from its previous value to the next whenever it
 * changes, using requestAnimationFrame with an ease-out curve. Returns the
 * current value to render.
 *
 * On first mount `from === to`, so there's no animation on initial load — only
 * later changes (e.g. a balance top-up or gift-card redemption) animate. If the
 * value changes mid-animation, it retargets from the value currently on screen.
 */
export function useAnimatedNumber(value: number, duration = 900) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayRef.current;
    const to = value;
    if (from === to) return;

    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = Math.round(from + (to - from) * eased);
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return display;
}
