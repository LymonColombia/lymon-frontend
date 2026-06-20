import { GuestExperience } from '@/domain/entities/guest-experience.model';

export interface AvailabilitySlot {
  date: string;
  startTime: string | null;
  endTime: string | null;
}

/** Tope para DATE_RANGE. */
const MAX_DATE_RANGE_DAYS = 20;
/** Tope de fechas a generar para RECURRING. */
const MAX_RECURRING_RESULTS = 12;
/** Ventana de búsqueda (en días hacia adelante) para experiencias RECURRING. */
const RECURRING_SEARCH_WINDOW_DAYS = 15;
const EMPTY_END_TIME = '00:00';

export function buildAvailableSlots(experience: GuestExperience): AvailabilitySlot[] {
  switch (experience.availabilityType) {
    case 'ONE_TIME':
      return buildOneTimeSlots(experience.startAt, experience.endAt);

    case 'DATE_RANGE':
      return buildDateRangeSlots(experience.startAt, experience.endAt, experience.blackoutRanges ?? []);

    case 'RECURRING':
      return experience.recurrence
        ? buildRecurringSlots(experience.recurrence, experience.blackoutRanges ?? [])
        : [];

    default:
      return [];
  }
}

/** ONE_TIME */
function buildOneTimeSlots(startAt: string | null, endAt: string | null): AvailabilitySlot[] {
  if (!startAt) return [];

  return [
    {
      date: isoDatePart(startAt),
      startTime: isoTimePart(startAt),
      endTime: endAt ? isoTimePart(endAt) : null,
    },
  ];
}

/** DATE_RANGE */
function buildDateRangeSlots(
  startAt: string | null,
  endAt: string | null,
  blackoutRanges: Array<{ startAt: string; endAt: string }>,
): AvailabilitySlot[] {
  if (!startAt || !endAt) return [];

  const startDateStr = isoDatePart(startAt);
  const endDateStr = isoDatePart(endAt);

  const cursor = localMidnight(startDateStr);
  const finalDate = localMidnight(endDateStr);

  if (Number.isNaN(cursor.getTime()) || Number.isNaN(finalDate.getTime()) || cursor > finalDate) {
    return [];
  }

  const dailyStartTime = isoTimePart(startAt);
  const dailyEndTime = isoTimePart(endAt);

  const slots: AvailabilitySlot[] = [];
  let daysProcessed = 0;

  while (cursor <= finalDate && daysProcessed < MAX_DATE_RANGE_DAYS) {
    const currentDateStr = toIsoDate(cursor);

    if (!isDateBlocked(currentDateStr, blackoutRanges)) {
      slots.push({
        date: currentDateStr,
        startTime: dailyStartTime,
        endTime: dailyEndTime,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
    daysProcessed++;
  }

  return slots;
}

/** RECURRING */
function buildRecurringSlots(
  recurrence: { daysOfWeek: number[]; startTime?: string; endTime?: string },
  blackoutRanges: Array<{ startAt: string; endAt: string }>,
): AvailabilitySlot[] {
  if (!recurrence.daysOfWeek?.length) return [];

  const allowedDays = new Set(recurrence.daysOfWeek);

  const endTime = recurrence.endTime && recurrence.endTime !== EMPTY_END_TIME ? recurrence.endTime : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots: AvailabilitySlot[] = [];

  for (
    let offset = 0;
    offset < RECURRING_SEARCH_WINDOW_DAYS && slots.length < MAX_RECURRING_RESULTS;
    offset++
  ) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);

    if (!allowedDays.has(candidate.getDay())) continue;

    const candidateDateStr = toIsoDate(candidate);
    if (isDateBlocked(candidateDateStr, blackoutRanges)) continue;

    slots.push({
      date: candidateDateStr,
      startTime: recurrence.startTime ?? null,
      endTime,
    });
  }

  return slots;
}

function isoDatePart(isoString: string): string {
  return isoString.substring(0, 10);
}

function isoTimePart(isoString: string): string {
  return isoString.substring(11, 16);
}

function localMidnight(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDateBlocked(dateStr: string, blackoutRanges: Array<{ startAt: string; endAt: string }>): boolean {
  return blackoutRanges.some((range) => {
    const blockStart = isoDatePart(range.startAt);
    const blockEnd = isoDatePart(range.endAt);
    return dateStr >= blockStart && dateStr <= blockEnd;
  });
}
