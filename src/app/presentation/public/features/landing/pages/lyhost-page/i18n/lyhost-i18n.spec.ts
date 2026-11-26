import { TestBed } from '@angular/core/testing';
import { LYHOST_LANG, LYHOST_LANGS, lyhostLandingPath } from './lyhost-i18n';
import es from './es.json';
import en from './en.json';

describe('landing translations', () => {
  /** Every leaf path, with array lengths, so a missing or extra string in one language shows up. */
  const shape = (value: unknown, path = ''): string[] => {
    if (Array.isArray(value)) return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k));
    }
    return [path];
  };

  it('gives English exactly the same keys and list lengths as Spanish', () => {
    expect(shape(en)).toEqual(shape(es));
  });
});

describe('lyhostLandingPath', () => {
  it('sends /lyhost to the landing in the detected language', () => {
    for (const lang of LYHOST_LANGS) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: LYHOST_LANG, useValue: lang }] });
      expect(TestBed.runInInjectionContext(lyhostLandingPath)).toBe(`/lyhost/${lang}`);
    }
  });
});
