import { EnvironmentProviders, Injectable, isDevMode } from '@angular/core';
import { Translation, TranslocoLoader, provideTransloco } from '@jsverse/transloco';

/**
 * App-wide translation setup (Transloco).
 *
 * - App-wide text lives in `presentation/shared/i18n/<lang>.json`.
 * - Each feature keeps its own text next to its code as a Transloco scope
 *   (for example the landing: `features/landing/pages/lyhost-page/i18n/<lang>.json`, scope `landing`),
 *   loaded only when that feature opens.
 */

export const APP_LANGS = ['es', 'en'] as const;
export type AppLang = (typeof APP_LANGS)[number];

/** Spanish is the product's home language, so it wins when the browser asks for neither. */
export const DEFAULT_LANG: AppLang = 'es';

export function isAppLang(value: string): value is AppLang {
  return (APP_LANGS as readonly string[]).includes(value);
}

/**
 * Pick a language from the browser's preference list (`navigator.languages`, most wanted first):
 * the first entry whose primary tag we translate wins, so `['fr-FR', 'en-US', 'es']` gives English.
 */
export function detectLang(preferred: readonly string[] | undefined): AppLang {
  for (const tag of preferred ?? []) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isAppLang(primary)) return primary;
  }
  return DEFAULT_LANG;
}

/** The visitor's language according to their browser. */
export function browserLang(): AppLang {
  if (typeof navigator === 'undefined') return DEFAULT_LANG;
  return detectLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

/** Bundled with the app (no HTTP request, so no auth interceptor on static text). */
const APP_TRANSLATIONS: Record<AppLang, () => Promise<Translation>> = {
  es: () => import('./es.json').then((m) => m.default),
  en: () => import('./en.json').then((m) => m.default),
};

@Injectable({ providedIn: 'root' })
export class AppTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Promise<Translation> {
    return isAppLang(lang) ? APP_TRANSLATIONS[lang]() : Promise.resolve({});
  }
}

export function provideAppI18n(): EnvironmentProviders[] {
  return provideTransloco({
    config: {
      availableLangs: [...APP_LANGS],
      defaultLang: browserLang(),
      fallbackLang: DEFAULT_LANG,
      missingHandler: { useFallbackTranslation: true },
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
    },
    loader: AppTranslocoLoader,
  });
}
