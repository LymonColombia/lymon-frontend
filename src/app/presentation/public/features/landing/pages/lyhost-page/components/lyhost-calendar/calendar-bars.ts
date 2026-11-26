/** Booking channel shown on the demo calendar: LyHost direct, Booking.com, Airbnb. */
export type Channel = 'ly' | 'bk' | 'ab';

/** [start day relative to today, nights, channel, guest label, optional walkthrough spot id] */
export type Stay = [number, number, Channel, string, string?];

export interface CalendarBar {
  label: string;
  letter: string;
  channel: Channel;
  spot: string | null;
  left: string;
  width: string;
  delay: string;
}

export interface CalendarRow {
  room: string;
  bars: CalendarBar[];
}

export interface CalendarDay {
  dow: string;
  dn: string;
  today: boolean;
  weekend: boolean;
}

const WEEK = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const LETTER: Record<Channel, string> = { ly: 'L', bk: 'B', ab: 'A' };
/** Day number of "today" in the demo (lun 16 nov). */
const TODAY = 16;

export function calendarDays(from: number, cols: number): CalendarDay[] {
  return Array.from({ length: cols }, (_, i) => {
    const dow = WEEK[(((from + i) % 7) + 7) % 7];
    return { dow, dn: String(TODAY + from + i), today: from + i === 0, weekend: dow === 'sáb' || dow === 'dom' };
  });
}

/** Bars run from afternoon arrival (+0.5) to morning departure, clipped to the visible window. */
export function calendarRows(rows: [string, Stay[]][], from: number, cols: number): CalendarRow[] {
  return rows.map(([room, stays], rowIndex) => ({
    room,
    bars: stays.flatMap(([start, nights, channel, label, spot], i) => {
      const a = start - from + 0.5;
      const b = a + nights;
      if (b <= 0 || a >= cols) return [];
      const clipLeft = a < 0;
      const clipRight = b > cols;
      const a2 = Math.max(0, a);
      const b2 = Math.min(cols, b);
      const padL = clipLeft ? 0 : 2;
      const padR = clipRight ? 0 : 2;
      return [
        {
          label,
          letter: LETTER[channel],
          channel,
          spot: spot ?? null,
          left: `calc(${(a2 / cols) * 100}% + ${padL}px)`,
          width: `calc(${((b2 - a2) / cols) * 100}% - ${padL + padR}px)`,
          delay: `${(0.75 + rowIndex * 0.07 + i * 0.05).toFixed(2)}s`,
        },
      ];
    }),
  }));
}
