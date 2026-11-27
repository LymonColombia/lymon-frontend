import { Signal, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { ProviderScope, Translation, TranslocoService, translateObjectSignal } from '@jsverse/transloco';
import { map } from 'rxjs';
import { AppLang } from '@/presentation/shared/i18n/i18n';
import type esText from './es.json';

/**
 * The tenant auth pages' own Transloco scope. Text lives next to the pages in `es.json` (the source)
 * and `en.json`, bundled with the auth code. There is no language in the URL: the pages follow the
 * active language (the one the landing set, else the browser's).
 */
export type AuthText = typeof esText;

const SCOPE = 'auth';

const loaders: Record<AppLang, () => Promise<Translation>> = {
  es: () => import('./es.json'),
  en: () => import('./en.json'),
};

export const AUTH_SCOPE: ProviderScope = { scope: SCOPE, loader: loaders };

/** The same loaders keyed the way `TranslocoService.load` asks for them (`auth/es`, `auth/en`). */
const scopedLoaders = Object.fromEntries(
  Object.entries(loaders).map(([lang, load]) => [`${SCOPE}/${lang}`, load]),
);

/** One page of the auth text (`authText('login')().title`), in the active language. */
export function authText<K extends keyof AuthText>(page: K): Signal<AuthText[K]> {
  return translateObjectSignal(page, {}, AUTH_SCOPE) as unknown as Signal<AuthText[K]>;
}

/** Route guard: load the auth text in the active language before the page renders, so it never shows empty strings. */
export const loadAuth: CanActivateFn = () => {
  const transloco = inject(TranslocoService);
  return transloco
    .load(`${SCOPE}/${transloco.getActiveLang()}`, { inlineLoader: scopedLoaders })
    .pipe(map(() => true));
};
