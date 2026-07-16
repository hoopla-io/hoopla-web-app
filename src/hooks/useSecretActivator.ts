import { useCallback, useRef } from "react";

/**
 * Returns an onClick handler that fires `onActivate` once it's tapped `taps`
 * times, with no more than `windowMs` between taps — a hidden gesture (e.g. tap
 * the logo 5× to toggle test mode). The counter resets if the taps stall.
 */
export function useSecretActivator(
  onActivate: () => void,
  taps = 5,
  windowMs = 1500
) {
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(() => {
    count.current += 1;
    if (timer.current) clearTimeout(timer.current);

    if (count.current >= taps) {
      count.current = 0;
      onActivate();
      return;
    }
    timer.current = setTimeout(() => {
      count.current = 0;
    }, windowMs);
  }, [onActivate, taps, windowMs]);
}
