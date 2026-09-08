import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { enUS, ru, uz, type Locale as DateFnsLocale } from "date-fns/locale";

import { getLanguage, type AppLanguage } from "@/helpers/language";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INTL_LOCALES: Record<AppLanguage, string> = {
  en: "en-US",
  ru: "ru-RU",
  uz: "uz-UZ",
};

export function formatBalance(amount: number): string {
  return new Intl.NumberFormat(INTL_LOCALES[getLanguage()]).format(amount);
}

/**
 * `formatBalance` followed by the translated currency label (`common.currency`
 * — "UZS"/"сум"/"so'm"). Pass the `t` from `useTranslation()`.
 */
export function formatMoney(amount: number, t: (key: string) => string): string {
  return `${formatBalance(amount)} ${t("common.currency")}`;
}

/** Placeholder name new accounts get until the user sets their own. */
export const DEFAULT_USER_NAME = "qahvazor";

const DATE_FNS_LOCALES: Record<AppLanguage, DateFnsLocale> = {
  en: enUS,
  ru,
  uz,
};

/** Current app language's date-fns locale, for `format`/`formatDistanceToNow` calls. */
export function getDateFnsLocale(): DateFnsLocale {
  return DATE_FNS_LOCALES[getLanguage()];
}

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
 * Whether the current time of day falls within an openAt/closeAt window.
 * Handles overnight ranges (e.g. 22:00–02:00). Malformed times report
 * closed rather than guessing open.
 */
export function isWithinWorkingHours(hours: {
  openAt: string;
  closeAt: string;
}): boolean {
  // Returns minutes-since-midnight, or NaN for a malformed "HH:mm" string.
  const toMinutes = (time: string) => {
    const [h, m] = (time ?? "").split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(hours.openAt);
  const close = toMinutes(hours.closeAt);

  if (Number.isNaN(open) || Number.isNaN(close)) return false;
  return close > open
    ? current >= open && current < close
    : current >= open || current < close; // overnight range
}

/**
 * Compute whether a shop is currently open from its weekly working hours.
 * Returns `todayHours: null` when there is no schedule entry for today
 * (treated as closed / unknown). Prefer the backend-provided
 * `todayWorkingHours` (see `Shop`) over this where available — it avoids the
 * client-locale weekday lookup this does below.
 */
export function getShopOpenStatus(
  workingHours?: WorkingHour[] | null
): ShopOpenStatus {
  if (!workingHours?.length) return { isOpen: false, todayHours: null };

  const today = new Date()
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();
  const todayHours = workingHours.find(
    (h) => h.weekDay.toLowerCase() === today
  );
  if (!todayHours) return { isOpen: false, todayHours: null };

  return {
    isOpen: isWithinWorkingHours(todayHours),
    todayHours: { openAt: todayHours.openAt, closeAt: todayHours.closeAt },
  };
}
