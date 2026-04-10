import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapChevronLeft, bootstrapChevronRight } from '@ng-icons/bootstrap-icons';

export interface BookingDateRange {
  checkIn: string | null;
  checkOut: string | null;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

@Component({
  selector: 'room-booking-calendar',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapChevronLeft, bootstrapChevronRight })],
  templateUrl: './room-booking-calendar.component.html',
  styleUrl: './room-booking-calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomBookingCalendarComponent {
  readonly dateRangeChange = output<BookingDateRange>();

  readonly weekdays = WEEKDAYS;

  private readonly today = new Date();
  private readonly todayStr = this.toDateStr(this.today);

  private readonly viewYear = signal(this.today.getFullYear());
  private readonly viewMonth = signal(this.today.getMonth());
  private readonly startDate = signal<Date | null>(null);
  private readonly endDate = signal<Date | null>(null);

  readonly monthLabel = computed(() => `${MONTH_NAMES[this.viewMonth()]} ${this.viewYear()}`);

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const startStr = this.startDate() ? this.toDateStr(this.startDate()!) : null;
    const endStr = this.endDate() ? this.toDateStr(this.endDate()!) : null;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    // Leading days from previous month
    for (let i = firstDay.getDay(); i > 0; i--) {
      days.push(this.makeDay(new Date(year, month, 1 - i), false, startStr, endStr));
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(this.makeDay(new Date(year, month, d), true, startStr, endStr));
    }

    // Trailing days to fill last row
    const trailing = 7 - (days.length % 7);
    if (trailing < 7) {
      for (let d = 1; d <= trailing; d++) {
        days.push(this.makeDay(new Date(year, month + 1, d), false, startStr, endStr));
      }
    }

    return days;
  });

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((m) => m + 1);
    }
  }

  onDayClick(day: CalendarDay): void {
    if (!day.isCurrentMonth || day.isPast) return;

    const clickedStr = this.toDateStr(day.date);
    const start = this.startDate();
    const end = this.endDate();
    const startStr = start ? this.toDateStr(start) : null;

    if (!start || (start && end)) {
      this.startDate.set(day.date);
      this.endDate.set(null);
      this.emit(clickedStr, null);
    } else if (clickedStr > startStr!) {
      this.endDate.set(day.date);
      this.emit(startStr!, clickedStr);
    } else if (clickedStr === startStr) {
      this.startDate.set(null);
      this.emit(null, null);
    } else {
      this.startDate.set(day.date);
      this.endDate.set(null);
      this.emit(clickedStr, null);
    }
  }

  private makeDay(
    date: Date,
    isCurrentMonth: boolean,
    startStr: string | null,
    endStr: string | null,
  ): CalendarDay {
    const dateStr = this.toDateStr(date);
    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: dateStr === this.todayStr,
      isPast: dateStr < this.todayStr,
      isStart: dateStr === startStr,
      isEnd: dateStr === endStr,
      isInRange: !!(startStr && endStr && dateStr > startStr && dateStr < endStr),
    };
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
}
