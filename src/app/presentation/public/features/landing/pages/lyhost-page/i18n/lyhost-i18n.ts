import { InjectionToken, inject } from '@angular/core';
import { LYHOST_ES, LyhostText } from './lyhost.es';
import { LYHOST_EN } from './lyhost.en';

export type { LyhostText } from './lyhost.es';

export type LyhostLang = 'es' | 'en';

export const LYHOST_TEXTS: Record<LyhostLang, LyhostText> = { es: LYHOST_ES, en: LYHOST_EN };

/** Spanish is the product's home language, so it wins when the browser asks for neither. */
export const LYHOST_DEFAULT_LANG: LyhostLang = 'es';

/**
 * Pick the landing language from the browser's preference list (`navigator.languages`, most wanted first):
 * the first entry whose primary tag we translate wins, so `['fr-FR', 'en-US', 'es']` gives English.
 */
export function detectLyhostLang(preferred: readonly string[] | undefined): LyhostLang {
  for (const tag of preferred ?? []) {
    const primary = tag.toLowerCase().split('-')[0];
    if (primary in LYHOST_TEXTS) return primary as LyhostLang;
  }
  return LYHOST_DEFAULT_LANG;
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

/** Language of the landing page for this visitor, detected once. */
export const LYHOST_LANG = new InjectionToken<LyhostLang>('LYHOST_LANG', {
  providedIn: 'root',
  factory: () => detectLyhostLang(browserLanguages()),
});

/** The landing text in the visitor's language. Components read their strings from here. */
export const LYHOST_TEXT = new InjectionToken<LyhostText>('LYHOST_TEXT', {
  providedIn: 'root',
  factory: () => LYHOST_TEXTS[inject(LYHOST_LANG)],
});
