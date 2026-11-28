/** Booking channels the calendar knows how to color. */
export type Channel = 'ly' | 'bk' | 'ab' | 'ot';

export interface ChannelInfo {
  readonly label: string;
  readonly letter: string;
}

export const CHANNELS: Readonly<Record<Channel, ChannelInfo>> = {
  ly: { label: 'LyHost', letter: 'L' },
  bk: { label: 'Booking.com', letter: 'B' },
  ab: { label: 'Airbnb', letter: 'A' },
  ot: { label: 'Otros canales', letter: 'O' },
};

export const CHANNEL_ORDER: readonly Channel[] = ['ly', 'bk', 'ab', 'ot'];

/** Maps the backend `source` of a reservation to a calendar channel. */
export function channelOf(source: string | undefined | null): Channel {
  switch ((source ?? '').trim().toUpperCase()) {
    case '':
    case 'MANUAL':
    case 'DIRECT':
    case 'LYHOST':
      return 'ly';
    case 'BOOKING':
    case 'BOOKING.COM':
      return 'bk';
    case 'AIRBNB':
      return 'ab';
    default:
      return 'ot';
  }
}

const MS_PER_DAY = 86_400_000;
const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Days since the epoch for a `YYYY-MM-DD` string, or NaN when it is not one. */
export function dayNumber(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!match) return Number.NaN;
  return Math.round(Date.UTC(+match[1], +match[2] - 1, +match[3]) / MS_PER_DAY);
}

/** Today in the user's own calendar, as days since the epoch. */
export function todayNumber(now: Date = new Date()): number {
  return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_PER_DAY);
}

export function dateOf(day: number): Date {
  return new Date(day * MS_PER_DAY);
}

/** `vie 14 nov` */
export function formatDay(day: number): string {
  const d = dateOf(day);
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** `14 – 20 nov 2026`, or `28 nov – 4 dic 2026` when the window crosses a month. */
export function formatRange(first: number, last: number): string {
  const a = dateOf(first);
  const b = dateOf(last);
  const tail = `${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  return a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()
    ? `${a.getUTCDate()} – ${b.getUTCDate()} ${tail}`
    : `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} – ${b.getUTCDate()} ${tail}`;
}

export interface DayCell {
  readonly offset: number;
  readonly dow: string;
  readonly dn: number;
  readonly today: boolean;
  readonly weekend: boolean;
}

/** Header cells for the offsets `[from, to)` counted from `today`. */
export function buildDays(from: number, to: number, today: number): DayCell[] {
  const cells: DayCell[] = [];
  for (let offset = from; offset < to; offset++) {
    const d = dateOf(today + offset);
    const dow = d.getUTCDay();
    cells.push({
      offset,
      // The first of a month names the month, so the header still tells where you are.
      dow: d.getUTCDate() === 1 ? MONTHS[d.getUTCMonth()] : DOW[dow],
      dn: d.getUTCDate(),
      today: offset === 0,
      weekend: dow === 0 || dow === 6,
    });
  }
  return cells;
}
