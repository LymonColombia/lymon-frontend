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
  bootstrapBoxArrowRight,
  bootstrapCalendar,
  bootstrapCalendar2Check,
  bootstrapCart,
  bootstrapChevronDown,
  bootstrapSearch,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { CalendarComponent, DateRange } from '@/presentation/shared/components/calendar/calendar.component';
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
  selector: 'room-details-nav',
  standalone: true,
  imports: [ButtonComponent, CalendarComponent, GuestStepperComponent, NgOptimizedImage, NgIcon, RouterModule],
  providers: [
    provideIcons({
      bootstrapBoxArrowInRight,
      bootstrapBoxArrowRight,
      bootstrapCalendar,
      bootstrapCalendar2Check,
      bootstrapCart,
      bootstrapChevronDown,
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
  readonly search = output<RoomDetailsSearchParams>();

  readonly isDropdownOpen = signal(false);
  readonly isCalendarOpen = signal(false);

  readonly checkIn = signal<string | undefined>(undefined);
  readonly checkOut = signal<string | undefined>(undefined);
  readonly guests = signal<number>(MIN_GUESTS);

  readonly MIN_GUESTS = MIN_GUESTS;
  readonly MAX_GUESTS = MAX_GUESTS;

  readonly checkInDisplay = computed(() => this.formatDate(this.checkIn() ?? null));
  readonly checkOutDisplay = computed(() => this.formatDate(this.checkOut() ?? null));

  readonly initials = computed(() => {
    const email = (this.guestEmail() ?? '').trim();
    if (!email) return '?';

    const [localPart] = email.split('@');
    if (!localPart) return '?';

    return localPart.slice(0, 2).toUpperCase();
  });

  readonly profileLabel = computed(() => {
    const email = (this.guestEmail() ?? '').trim();
    if (!email) {
      return 'Guest';
    }

    const [localPart] = email.split('@');
    if (!localPart) {
      return email;
    }

    return localPart;
  });

  toggleDropdown(): void {
    this.isDropdownOpen.update((v) => !v);
  }

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

  onMyReservations(): void {
    this.isDropdownOpen.set(false);
    this.myReservationsClicked.emit();
  }

  onLogout(): void {
    this.isDropdownOpen.set(false);
    this.logoutClicked.emit();
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target) return;

    if (this.isDropdownOpen() && !this.elementRef.nativeElement.contains(target)) {
      this.isDropdownOpen.set(false);
    }

    if (this.isCalendarOpen()) {
      const wrapper = this.elementRef.nativeElement.querySelector(DATE_TRIGGER_SELECTOR) as Element | null;
      if (wrapper && !wrapper.contains(target)) {
        this.isCalendarOpen.set(false);
      }
    }
  }

  onSearch(): void {
    this.isCalendarOpen.set(false);
    this.search.emit({
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
