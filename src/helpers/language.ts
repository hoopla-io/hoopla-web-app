// Customer's preferred language. Sent as `X-App-Language` on every request
// (see http-client.tsx) so hoopla-api can localize server-driven content
// (notifications, banners, feedback prompts, etc), and drives the app's own
// UI language via i18next (see @/i18n.ts) — this module owns the persisted
// preference; i18n.ts owns loading/rendering translations for it.

export type AppLanguage = "uz" | "ru" | "en";

export const LANGUAGE_OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

const KEY = "hoopla_language";
export const DEFAULT_LANGUAGE: AppLanguage = "ru";

function isAppLanguage(value: string | null): value is AppLanguage {
  return value !== null && LANGUAGE_OPTIONS.some((opt) => opt.value === value);
}

export function getLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(KEY);
    return isAppLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function setLanguage(language: AppLanguage): void {
  try {
    localStorage.setItem(KEY, language);
  } catch {
    /* private mode / storage disabled */
  }
}
