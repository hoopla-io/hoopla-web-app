import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Placeholder name new accounts get until the user sets their own. */
export const DEFAULT_USER_NAME = "qahvazor";

export type WorkingHour = {
  weekDay: string;
  openAt: string;
  closeAt: string;
};

export type ShopOpenStatus = {
  isOpen: boolean;
  todayHours: { openAt: string; closeAt: string } | null;
};

/**
 * Compute whether a shop is currently open from its weekly working hours.
 * Handles overnight ranges (e.g. 22:00–02:00). Returns `todayHours: null`
 * when there is no schedule entry for today (treated as closed / unknown).
 */
export function getShopOpenStatus(
  workingHours?: WorkingHour[] | null
): ShopOpenStatus {
  if (!workingHours?.length) return { isOpen: false, todayHours: null };

  const now = new Date();
  const today = now
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();
  const todayHours = workingHours.find(
    (h) => h.weekDay.toLowerCase() === today
  );
  if (!todayHours) return { isOpen: false, todayHours: null };

  // Returns minutes-since-midnight, or NaN for a malformed "HH:mm" string.
  const toMinutes = (time: string) => {
    const [h, m] = (time ?? "").split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };
  const current = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(todayHours.openAt);
  const close = toMinutes(todayHours.closeAt);

  // If the hours can't be parsed, report closed rather than guessing open.
  const isOpen =
    Number.isNaN(open) || Number.isNaN(close)
      ? false
      : close > open
      ? current >= open && current < close
      : current >= open || current < close; // overnight range

  return {
    isOpen,
    todayHours: { openAt: todayHours.openAt, closeAt: todayHours.closeAt },
  };
}
