import { LYHOST_TEXTS, detectLyhostLang } from './lyhost-i18n';

describe('detectLyhostLang', () => {
  it('picks Spanish for any Spanish locale', () => {
    expect(detectLyhostLang(['es-CO', 'en-US'])).toBe('es');
    expect(detectLyhostLang(['ES'])).toBe('es');
  });

  it('picks English for any English locale', () => {
    expect(detectLyhostLang(['en-GB'])).toBe('en');
  });

  it('skips languages it has no text for and takes the next one the visitor accepts', () => {
    expect(detectLyhostLang(['fr-FR', 'en-US', 'es'])).toBe('en');
    expect(detectLyhostLang(['pt-BR', 'es-MX'])).toBe('es');
  });

  it('falls back to Spanish when nothing matches or the list is empty', () => {
    expect(detectLyhostLang(['de-DE', 'ja'])).toBe('es');
    expect(detectLyhostLang([])).toBe('es');
    expect(detectLyhostLang(undefined)).toBe('es');
  });
});

describe('LYHOST_TEXTS', () => {
  /** Every leaf path, with array lengths, so a missing or extra string in one language shows up. */
  const shape = (value: unknown, path = ''): string[] => {
    if (Array.isArray(value)) return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k));
    }
    return [path];
  };

  it('gives English exactly the same keys and list lengths as Spanish', () => {
    expect(shape(LYHOST_TEXTS.en)).toEqual(shape(LYHOST_TEXTS.es));
  });
});
