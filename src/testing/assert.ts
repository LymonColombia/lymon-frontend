/**
 * Helper de assertions determinísticos.
 * Realiza comparación case-insensitive. Lanza Error descriptivo si falla.
 */
export function assertIncludes(actual: string, expected: string, message?: string): void {
  const a = actual.toLowerCase();
  const e = expected.toLowerCase();
  if (!a.includes(e)) {
    throw new Error(
      message || `Assertion failed: "${actual}" no incluye "${expected}"`,
    );
  }
}

/**
 * Assert exacto.
 */
export function assertEquals(actual: unknown, expected: unknown, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message || `Assertion failed: esperado ${expected}, obtenido ${actual}`,
    );
  }
}
