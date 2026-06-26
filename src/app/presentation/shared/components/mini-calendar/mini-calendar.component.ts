import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapChevronLeft, bootstrapChevronRight } from '@ng-icons/bootstrap-icons';
import { OccupiedDateRange } from '@/domain/entities/guest-reservation.model';

export interface DateRange {
  checkIn: string | null;
  checkOut: string | null;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isOccupied: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isInHoverRange: boolean;
  isHoverEnd: boolean;
  isHoverInvalid: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

const DECEMBER_MONTH_INDEX = 11;
const DAYS_IN_WEEK = 7;
const ISO_DATE_PREFIX_LENGTH = 10;

@Component({
  selector: 'app-mini-calendar',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapChevronLeft, bootstrapChevronRight })],
  templateUrl: './mini-calendar.component.html',
  styleUrl: './mini-calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniCalendarComponent {
  readonly occupiedRanges = input<OccupiedDateRange[]>([]);
  readonly initialStartDate = input<string | null>(null);
  readonly initialEndDate = input<string | null>(null);
  readonly singleDate = input<boolean>(false);

  readonly dateRangeChange = output<DateRange>();
  readonly closeRequested = output<void>();

  readonly weekdays = WEEKDAYS;

  private readonly today = new Date();
  private readonly todayStr = this.toDateStr(this.today);

  private readonly viewYear = signal(this.today.getFullYear());
  private readonly viewMonth = signal(this.today.getMonth());
  private readonly startDate = signal<Date | null>(null);
  private readonly endDate = signal<Date | null>(null);
  private readonly hoverDate = signal<string | null>(null);

  readonly monthLabel = computed(() => `${MONTH_NAMES[this.viewMonth()]} ${this.viewYear()}`);

  readonly isAtCurrentMonth = computed(
    () => this.viewYear() === this.today.getFullYear() && this.viewMonth() === this.today.getMonth(),
  );

  readonly prompt = computed<string | null>(() => {
    if (this.singleDate()) {
      return this.startDate() ? null : 'Selecciona la fecha';
    }
    if (!this.startDate()) return 'Selecciona la fecha de entrada';
    if (!this.endDate()) return 'Ahora selecciona la fecha de salida';
    return null;
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const start = this.startDate();
    const end = this.endDate();
    const startStr = start ? this.toDateStr(start) : null;
    const endStr = end ? this.toDateStr(end) : null;
    const hoverStr = this.hoverDate();
    const occupied = this.occupiedRanges();
    const isSingle = this.singleDate();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    for (let i = firstDay.getDay(); i > 0; i--) {
      days.push(this.makeDay(new Date(year, month, 1 - i), false, startStr, endStr, hoverStr, occupied, isSingle));
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(this.makeDay(new Date(year, month, d), true, startStr, endStr, hoverStr, occupied, isSingle));
    }

    const trailing = DAYS_IN_WEEK - (days.length % DAYS_IN_WEEK);
    if (trailing < DAYS_IN_WEEK) {
      for (let d = 1; d <= trailing; d++) {
        days.push(this.makeDay(new Date(year, month + 1, d), false, startStr, endStr, hoverStr, occupied, isSingle));
      }
    }

    return days;
  });

  constructor() {
    effect(() => {
      const start = this.initialStartDate();
      if (start) {
        const parsed = this.parseDate(start);
        this.startDate.set(parsed);
        this.viewYear.set(parsed.getFullYear());
        this.viewMonth.set(parsed.getMonth());
      } else {
        this.startDate.set(null);
      }
    });

    effect(() => {
      const end = this.initialEndDate();
      this.endDate.set(end ? this.parseDate(end) : null);
    });
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(DECEMBER_MONTH_INDEX);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === DECEMBER_MONTH_INDEX) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
  }

  onDayMouseEnter(day: CalendarDay): void {
    if (!day.isCurrentMonth || day.isPast || day.isOccupied) return;
    this.hoverDate.set(this.toDateStr(day.date));
  }

  onCalDaysMouseLeave(): void {
    this.hoverDate.set(null);
  }

  onDayClick(day: CalendarDay): void {
    if (!day.isCurrentMonth || day.isPast || day.isOccupied) return;

    const clickedStr = this.toDateStr(day.date);

    if (this.singleDate()) {
      this.startDate.set(day.date);
      this.endDate.set(null);
      this.emit(clickedStr, null);
      this.closeRequested.emit();
      return;
    }

    const start = this.startDate();
    const startStr = start ? this.toDateStr(start) : null;
    const end = this.endDate();

    if (!startStr || !!end || clickedStr < startStr) {
      this.startDate.set(day.date);
      this.endDate.set(null);
      this.emit(clickedStr, null);
    } else if (clickedStr > startStr) {
      if (this.hasOccupiedInRange(startStr, clickedStr, this.occupiedRanges())) {
        this.startDate.set(day.date);
        this.endDate.set(null);
        this.emit(clickedStr, null);
      } else {
        this.endDate.set(day.date);
        this.emit(startStr, clickedStr);
        this.closeRequested.emit();
      }
    } else {
      this.startDate.set(null);
      this.emit(null, null);
    }
  }

  private makeDay(
    date: Date,
    isCurrentMonth: boolean,
    startStr: string | null,
    endStr: string | null,
    hoverStr: string | null,
    occupiedRanges: OccupiedDateRange[],
    isSingle: boolean,
  ): CalendarDay {
    const dateStr = this.toDateStr(date);
    const isOccupied = isCurrentMonth && occupiedRanges.some((r) => {
      const checkIn = r.checkIn.slice(0, ISO_DATE_PREFIX_LENGTH);
      const checkOut = r.checkOut.slice(0, ISO_DATE_PREFIX_LENGTH);
      return dateStr >= checkIn && dateStr < checkOut;
    });

    const isSelectingEnd = !isSingle && !!startStr && !endStr;
    const hoverAfterStart = isSelectingEnd && !!hoverStr && hoverStr > startStr;
    const hoverRangeInvalid =
      hoverAfterStart && !!hoverStr && this.hasOccupiedInRange(startStr, hoverStr, occupiedRanges);

    const isHoverEnd = hoverAfterStart && dateStr === hoverStr;
    const isInHoverRange =
      hoverAfterStart && !hoverRangeInvalid && !!hoverStr && dateStr > startStr && dateStr < hoverStr;
    const isHoverInvalid = isHoverEnd && hoverRangeInvalid;

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: dateStr === this.todayStr,
      isPast: dateStr < this.todayStr,
      isOccupied,
      isStart: dateStr === startStr,
      isEnd: dateStr === endStr,
      isInRange: !!(startStr && endStr && dateStr > startStr && dateStr < endStr),
      isInHoverRange,
      isHoverEnd,
      isHoverInvalid,
    };
  }

  private hasOccupiedInRange(from: string, to: string, ranges: OccupiedDateRange[]): boolean {
    return ranges.some((r) => {
      const checkIn = r.checkIn.slice(0, ISO_DATE_PREFIX_LENGTH);
      const checkOut = r.checkOut.slice(0, ISO_DATE_PREFIX_LENGTH);
      return checkIn < to && checkOut > from;
    });
  }

  private emit(checkIn: string | null, checkOut: string | null): void {
    this.dateRangeChange.emit({ checkIn, checkOut });
  }

  private toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private parseDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
}
