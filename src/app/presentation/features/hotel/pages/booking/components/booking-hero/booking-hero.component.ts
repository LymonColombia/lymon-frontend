import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCalendar, bootstrapPeopleFill, bootstrapSearch } from '@ng-icons/bootstrap-icons';
import { CalendarComponent, DateRange } from '@/presentation/shared/components/calendar/calendar.component';

export interface BookingSearchParams {
  startDate?: string;
  endDate?: string;
  minGuests?: number;
}

const MIN_GUESTS = 1;
const MAX_GUESTS = 10;
const SHORT_MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DATE_WRAPPER_SELECTOR = '.date-trigger-wrapper';

@Component({
  selector: 'booking-hero',
  standalone: true,
  imports: [NgIcon, CalendarComponent],
  providers: [provideIcons({ bootstrapCalendar, bootstrapPeopleFill, bootstrapSearch })],
  templateUrl: './booking-hero.component.html',
  styleUrl: './booking-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingHeroComponent implements OnInit {
  private readonly el = inject(ElementRef);

  readonly initialStartDate = input<string | undefined>(undefined);
  readonly initialEndDate = input<string | undefined>(undefined);
  readonly initialMinGuests = input<number | undefined>(undefined);
  readonly search = output<BookingSearchParams>();

  readonly checkInDate = signal<string | null>(null);
  readonly checkOutDate = signal<string | null>(null);
  readonly minGuests = signal<number>(MIN_GUESTS);
  readonly isCalendarOpen = signal(false);

  readonly MIN_GUESTS = MIN_GUESTS;
  readonly MAX_GUESTS = MAX_GUESTS;

  readonly checkInDisplay = computed(() => this.formatDate(this.checkInDate()));
  readonly checkOutDisplay = computed(() => this.formatDate(this.checkOutDate()));

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isCalendarOpen()) return;
    const target = event.target as Element | null;
    if (!target) return;
    const wrapper = this.el.nativeElement.querySelector(DATE_WRAPPER_SELECTOR) as Element | null;
    if (wrapper && !wrapper.contains(target)) {
      this.isCalendarOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.checkInDate.set(this.initialStartDate() ?? null);
    this.checkOutDate.set(this.initialEndDate() ?? null);
    this.minGuests.set(this.initialMinGuests() ?? MIN_GUESTS);
  }

  toggleCalendar(): void {
    this.isCalendarOpen.update((v) => !v);
  }

  closeCalendar(): void {
    this.isCalendarOpen.set(false);
  }

  onDateRangeChange(range: DateRange): void {
    this.checkInDate.set(range.checkIn);
    this.checkOutDate.set(range.checkOut);
  }

  incrementGuests(): void {
    if (this.minGuests() < MAX_GUESTS) this.minGuests.update((v) => v + 1);
  }

  decrementGuests(): void {
    if (this.minGuests() > MIN_GUESTS) this.minGuests.update((v) => v - 1);
  }

  onSearch(): void {
    this.search.emit({
      startDate: this.checkInDate() ?? undefined,
      endDate: this.checkOutDate() ?? undefined,
      minGuests: this.minGuests(),
    });
  }

  private formatDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return `${parts[2]} ${SHORT_MONTH_NAMES[parts[1] - 1]} ${parts[0]}`;
  }
}
