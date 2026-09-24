import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCalendar3 } from '@ng-icons/bootstrap-icons';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIso(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

@Component({
  selector: 'app-shift-date-picker',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapCalendar3 })],
  templateUrl: './shift-date-picker.html',
  styleUrl: './shift-date-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShiftDatePickerComponent {
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly value = input<string>('');
  readonly minDate = input<string>('');
  readonly maxDate = input<string>('');
  readonly rangeAnchor = input<string>('');
  readonly label = input<string>('');
  readonly placeholder = input<string>('Seleccionar fecha');
  readonly disabled = input<boolean>(false);
  readonly id = input<string>('');
  readonly name = input<string>('');

  readonly dateChange = output<string>();

  readonly isOpen = signal(false);
  readonly currentMonth = signal(new Date().getMonth());
  readonly currentYear = signal(new Date().getFullYear());
  readonly hoveredDate = signal<Date | null>(null);

  readonly selectedDate = computed(() => parseIso(this.value()));
  readonly anchorDate = computed(() => parseIso(this.rangeAnchor()));
  readonly monthLabel = computed(() => MONTHS[this.currentMonth()]);
  readonly displayValue = computed(() => this.value() || this.placeholder());

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const start = new Date(year, month, 1 - startDayOfWeek);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
      });
    }
    return days;
  });

  constructor() {
    effect(() => {
      const selected = this.selectedDate();
      if (selected) {
        this.currentMonth.set(selected.getMonth());
        this.currentYear.set(selected.getFullYear());
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && this.hostElement.nativeElement.contains(target)) return;
    this.close();
  }

  toggle(): void {
    if (this.disabled()) return;
    this.isOpen.update((open) => !open);
  }

  close(): void {
    this.isOpen.set(false);
    this.hoveredDate.set(null);
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update((y) => y - 1);
    } else {
      this.currentMonth.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update((y) => y + 1);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
  }

  isSelected(day: CalendarDay): boolean {
    const selected = this.selectedDate();
    return !!selected && isSameDay(selected, day.date);
  }

  isAnchor(day: CalendarDay): boolean {
    const anchor = this.anchorDate();
    return !!anchor && isSameDay(anchor, day.date);
  }

  isDisabled(day: CalendarDay): boolean {
    if (this.disabled()) return true;
    const min = parseIso(this.minDate());
    const max = parseIso(this.maxDate());
    const date = day.date;
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  }

  isInRange(day: CalendarDay): boolean {
    const hovered = this.hoveredDate();
    const boundary = this.anchorDate() ?? this.selectedDate();
    if (!hovered || !boundary) return false;
    const start = new Date(Math.min(hovered.getTime(), boundary.getTime()));
    const end = new Date(Math.max(hovered.getTime(), boundary.getTime()));
    const date = day.date;
    return date >= start && date <= end;
  }

  onHover(day: CalendarDay): void {
    if (this.isDisabled(day)) return;
    this.hoveredDate.set(day.date);
  }

  onMouseLeave(): void {
    this.hoveredDate.set(null);
  }

  select(day: CalendarDay): void {
    if (this.isDisabled(day)) return;
    this.dateChange.emit(toIso(day.date));
    this.close();
  }
}
