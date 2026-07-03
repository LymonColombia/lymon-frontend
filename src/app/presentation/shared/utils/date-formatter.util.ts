export function formatCalendarDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions,
  locale = 'es-CO',
): string {
  return new Date(dateStr).toLocaleDateString(locale, { ...options, timeZone: 'UTC' });
}
