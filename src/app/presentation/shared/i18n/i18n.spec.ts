import { detectLang } from './i18n';

describe('detectLang', () => {
  it('picks Spanish for any Spanish locale', () => {
    expect(detectLang(['es-CO', 'en-US'])).toBe('es');
    expect(detectLang(['ES'])).toBe('es');
  });

  it('picks English for any English locale', () => {
    expect(detectLang(['en-GB'])).toBe('en');
  });

  it('skips languages it has no text for and takes the next one the visitor accepts', () => {
    expect(detectLang(['fr-FR', 'en-US', 'es'])).toBe('en');
    expect(detectLang(['pt-BR', 'es-MX'])).toBe('es');
  });

  it('falls back to Spanish when nothing matches or the list is empty', () => {
    expect(detectLang(['de-DE', 'ja'])).toBe('es');
    expect(detectLang([])).toBe('es');
    expect(detectLang(undefined)).toBe('es');
  });
});
