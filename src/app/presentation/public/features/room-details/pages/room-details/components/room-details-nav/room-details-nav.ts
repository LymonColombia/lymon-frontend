import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxArrowInRight,
  bootstrapCalendar,
  bootstrapCart,
  bootstrapSearch,
} from '@ng-icons/bootstrap-icons';
import { ProfileMenuComponent } from '@/presentation/public/components/profile-menu/profile-menu';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { CalendarComponent, DateRange } from '@/presentation/shared/components/calendar/calendar';
import { GuestStepperComponent } from '@/presentation/public/features/room-details/pages/room-details/components/guest-stepper/guest-stepper';

export interface RoomDetailsSearchParams {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

const MIN_GUESTS = 1;
const MAX_GUESTS = 10;
const SHORT_MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DATE_TRIGGER_SELECTOR = '.nav-date-trigger-wrapper';

@Component({
  selector: 'app-room-details-nav',
  standalone: true,
  imports: [ButtonComponent, ProfileMenuComponent, CalendarComponent, GuestStepperComponent, NgOptimizedImage, NgIcon, RouterModule],
  providers: [
    provideIcons({
      bootstrapBoxArrowInRight,
      bootstrapCalendar,
      bootstrapCart,
      bootstrapSearch,
    }),
  ],
  templateUrl: './room-details-nav.html',
  styleUrl: './room-details-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class RoomDetailsNavComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly isAuthenticated = input.required<boolean>();
  readonly guestEmail = input<string | null>(null);

  readonly loginClicked = output<void>();
  readonly logoutClicked = output<void>();
  readonly myReservationsClicked = output<void>();
  readonly searchSubmit = output<RoomDetailsSearchParams>();

  readonly isCalendarOpen = signal(false);

  readonly checkIn = signal<string | undefined>(undefined);
  readonly checkOut = signal<string | undefined>(undefined);
  readonly guests = signal<number>(MIN_GUESTS);

  readonly MIN_GUESTS = MIN_GUESTS;
  readonly MAX_GUESTS = MAX_GUESTS;

  readonly checkInDisplay = computed(() => this.formatDate(this.checkIn() ?? null));
  readonly checkOutDisplay = computed(() => this.formatDate(this.checkOut() ?? null));

  toggleCalendar(): void {
    this.isCalendarOpen.update((v) => !v);
  }

  closeCalendar(): void {
    this.isCalendarOpen.set(false);
  }

  onDateRangeChange(range: DateRange): void {
    this.checkIn.set(range.checkIn ?? undefined);
    this.checkOut.set(range.checkOut ?? undefined);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target) return;

    if (this.isCalendarOpen()) {
      const wrapper = this.elementRef.nativeElement.querySelector(DATE_TRIGGER_SELECTOR) as Element | null;
      if (wrapper && !wrapper.contains(target)) {
        this.isCalendarOpen.set(false);
      }
    }
  }

  onSearch(): void {
    this.isCalendarOpen.set(false);
    this.searchSubmit.emit({
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      guests: this.guests(),
    });
  }

  private formatDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return `${parts[2]} ${SHORT_MONTH_NAMES[parts[1] - 1]} ${parts[0]}`;
  }
}
