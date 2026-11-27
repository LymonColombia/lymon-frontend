import {
  buildDays,
  channelOf,
  dayNumber,
  formatDay,
  formatRange,
  todayNumber,
} from './calendar.utils';

describe('calendar.utils', () => {
  it('maps sources to channels', () => {
    expect(channelOf('MANUAL')).toBe('ly');
    expect(channelOf('direct')).toBe('ly');
    expect(channelOf('')).toBe('ly');
    expect(channelOf('BOOKING')).toBe('bk');
    expect(channelOf('AIRBNB')).toBe('ab');
    expect(channelOf('VRBO')).toBe('ot');
  });

  it('counts days between ISO dates', () => {
    expect(dayNumber('2026-11-17') - dayNumber('2026-11-16')).toBe(1);
    expect(dayNumber('2026-03-01') - dayNumber('2026-02-28')).toBe(1);
    expect(dayNumber('nope')).toBeNaN();
  });

  it('reads today in local time', () => {
    const now = new Date(2026, 10, 16, 23, 30);
    expect(todayNumber(now)).toBe(dayNumber('2026-11-16'));
  });

  it('formats days and ranges in Spanish', () => {
    expect(formatDay(dayNumber('2026-11-16'))).toBe('lun 16 nov');
    expect(formatRange(dayNumber('2026-11-13'), dayNumber('2026-11-26'))).toBe('13 – 26 nov 2026');
    expect(formatRange(dayNumber('2026-11-28'), dayNumber('2026-12-04'))).toBe('28 nov – 4 dic 2026');
  });

  it('builds header cells and marks today', () => {
    const today = dayNumber('2026-11-30');
    const cells = buildDays(-1, 3, today);
    expect(cells.map((c) => c.dn)).toEqual([29, 30, 1, 2]);
    expect(cells[1].today).toBe(true);
    expect(cells[2].dow).toBe('dic');
  });
});
