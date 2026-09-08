// UI translation. Locale JSON is code-split per language (dynamic import, not
// a static top-level import of all three) so an unselected language's
// strings never enter the loaded bundle. `@/helpers/language.ts` owns the
// persisted preference and the `X-App-Language` header; this module owns
// turning that preference into rendered translations.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { getLanguage, DEFAULT_LANGUAGE, type AppLanguage } from "@/helpers/language";

const loaders: Record<AppLanguage, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import("@/locales/en.json"),
  ru: () => import("@/locales/ru.json"),
  uz: () => import("@/locales/uz.json"),
};

const loadedLanguages = new Set<AppLanguage>();

async function fetchResources(language: AppLanguage): Promise<Record<string, unknown>> {
  const { default: resources } = await loaders[language]();
  return resources;
}

/** Switch the app's UI language at runtime, loading its chunk on demand. */
export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  if (!loadedLanguages.has(language)) {
    const resources = await fetchResources(language);
    // i18next.store only exists once init() has run — safe here since
    // this is only ever called after initI18n() has resolved.
    i18n.addResourceBundle(language, "translation", resources);
    loadedLanguages.add(language);
  }
  await i18n.changeLanguage(language);
  document.documentElement.lang = language;
}

/** Call once at boot, before the first render. */
export async function initI18n(): Promise<void> {
  const initial = getLanguage();

  // Preload the fallback language too so a key missing from a translation
  // still resolves instead of showing the raw key.
  const langsToPreload = Array.from(new Set<AppLanguage>([initial, DEFAULT_LANGUAGE]));
  const entries = await Promise.all(
    langsToPreload.map(async (lng) => {
      const resources = await fetchResources(lng);
      loadedLanguages.add(lng);
      return [lng, { translation: resources }] as const;
    })
  );

  await i18n.use(initReactI18next).init({
    lng: initial,
    fallbackLng: DEFAULT_LANGUAGE,
    resources: Object.fromEntries(entries),
    interpolation: { escapeValue: false },
  });

  document.documentElement.lang = initial;
}

export default i18n;
