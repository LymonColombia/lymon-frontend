import { InjectionToken, Signal, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { ProviderScope, Translation, TranslocoService, translateObjectSignal } from '@jsverse/transloco';
import { map } from 'rxjs';
import { APP_LANGS, AppLang, browserLang } from '@/presentation/shared/i18n/i18n';
import type esText from './es.json';

/**
 * The landing's own Transloco scope. Its text lives next to the page in `es.json` (the source)
 * and `en.json`, bundled into the landing's code and only loaded when someone opens it.
 */
export type LyhostText = typeof esText;

/** Languages with a URL of their own: /lyhost/es, /lyhost/en. */
export const LYHOST_LANGS = APP_LANGS;

const SCOPE = 'landing';

const loaders: Record<AppLang, () => Promise<Translation>> = {
  es: () => import('./es.json'),
  en: () => import('./en.json'),
};

export const LANDING_SCOPE: ProviderScope = { scope: SCOPE, loader: loaders };

/** The same loaders keyed the way `TranslocoService.load` asks for them (`landing/es`, `landing/en`). */
const scopedLoaders = Object.fromEntries(
  Object.entries(loaders).map(([lang, load]) => [`${SCOPE}/${lang}`, load]),
);

/** Language of the landing page. Each /lyhost/<lang> route provides its own; elsewhere it is the browser's. */
export const LYHOST_LANG = new InjectionToken<AppLang>('LYHOST_LANG', {
  providedIn: 'root',
  factory: browserLang,
});

/** One section of the landing text (`landingText('hero')().titleA`), in the active language. */
export function landingText<K extends keyof LyhostText>(section: K): Signal<LyhostText[K]> {
  return translateObjectSignal(section, {}, LANDING_SCOPE) as unknown as Signal<LyhostText[K]>;
}

/**
 * Route guard for /lyhost/<lang>: switch the app to that language and load the landing text
 * (plus the Spanish fallback) before the page renders, so it never shows empty strings.
 */
export function loadLanding(lang: AppLang): CanActivateFn {
  return () => {
    const transloco = inject(TranslocoService);
    transloco.setActiveLang(lang);
    return transloco.load(`${SCOPE}/${lang}`, { inlineLoader: scopedLoaders }).pipe(map(() => true));
  };
}

/** Where a bare /lyhost (or any unknown URL) sends the visitor: the landing in their browser's language. */
export function lyhostLandingPath(): string {
  return `/lyhost/${inject(LYHOST_LANG)}`;
}
