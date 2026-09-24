import { describe, it, expect } from 'vitest';
import { formatCalendarDate } from './date-formatter.util';

describe('formatCalendarDate()', () => {
  it('should render the same calendar day as the raw date string when given a date-only string', () => {
    // "2026-07-01" is a bare calendar date (no time component). JS parses it as UTC midnight.
    // Because formatCalendarDate pins timeZone: 'UTC', the rendered day must stay July 1st
    // regardless of the local timezone offset of the machine running the test.
    const result = formatCalendarDate('2026-07-01', { day: '2-digit', month: 'short', year: 'numeric' });

    expect(result).toBe('01 de jul de 2026');
  });

  it('should not roll the day back for a negative-offset timezone boundary date', () => {
    // Regression guard for LYMON-1092: without timeZone: 'UTC', a viewer in Bogota (UTC-5)
    // would see "2026-06-30" instead of "2026-07-01" because toLocaleDateString would apply
    // the local offset to UTC midnight.
    const result = formatCalendarDate('2026-07-01', { day: '2-digit', month: 'short', year: 'numeric' }, 'es-MX');

    expect(result).not.toContain('30');
    expect(result).toContain('01');
  });

  it('should use the default locale es-CO when no locale is provided', () => {
    const result = formatCalendarDate('2026-01-15', { day: '2-digit', month: 'long', year: 'numeric' });

    expect(result).toBe('15 de enero de 2026');
  });

  it('should respect an explicit locale argument', () => {
    const result = formatCalendarDate('2026-01-15', { day: '2-digit', month: 'long', year: 'numeric' }, 'en-US');

    expect(result).toBe('January 15, 2026');
  });

  it('should always force UTC timeZone even if caller passes a conflicting timeZone option', () => {
    const result = formatCalendarDate(
      '2026-07-01',
      { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' },
      'es-MX',
    );

    // The spread order in the implementation places timeZone: 'UTC' after the caller options,
    // so UTC always wins — verifying this protects against a future regression that reorders the spread.
    expect(result).toBe('01 jul 2026');
  });

  it('should format a leap-year date correctly at the year boundary', () => {
    const result = formatCalendarDate('2028-02-29', { day: '2-digit', month: '2-digit', year: 'numeric' }, 'en-US');

    expect(result).toBe('02/29/2028');
  });

  it('should format a date at the December 31 / January 1 boundary without shifting years', () => {
    const result = formatCalendarDate('2026-12-31', { day: '2-digit', month: 'short', year: 'numeric' }, 'es-MX');

    expect(result).toBe('31 dic 2026');
  });

  it('should return "Invalid Date" text when given an unparseable string', () => {
    const result = formatCalendarDate('not-a-date', { day: '2-digit', month: 'short', year: 'numeric' });

    expect(result).toBe('Invalid Date');
  });
});
