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
  bootstrapPeopleFill,
  bootstrapSearch,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';

export interface RoomDetailsSearchParams {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

const MIN_GUESTS = 1;
const MAX_GUESTS = 10;

@Component({
  selector: 'room-details-nav',
  standalone: true,
  imports: [ButtonComponent, InputComponent, NgOptimizedImage, NgIcon, RouterModule],
  providers: [
    provideIcons({
      bootstrapBoxArrowInRight,
      bootstrapBoxArrowRight,
      bootstrapCalendar,
      bootstrapCalendar2Check,
      bootstrapCart,
      bootstrapChevronDown,
      bootstrapPeopleFill,
      bootstrapSearch,
    }),
  ],
  templateUrl: './room-details-nav.component.html',
  styleUrl: './room-details-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class RoomDetailsNavComponent {
  private readonly elementRef = inject(ElementRef);

  readonly isAuthenticated = input.required<boolean>();
  readonly guestEmail = input<string | null>(null);

  readonly loginClicked = output<void>();
  readonly logoutClicked = output<void>();
  readonly myReservationsClicked = output<void>();
  readonly search = output<RoomDetailsSearchParams>();

  readonly isDropdownOpen = signal(false);

  readonly checkIn = signal<string | undefined>(undefined);
  readonly checkOut = signal<string | undefined>(undefined);
  readonly guests = signal<number>(MIN_GUESTS);

  readonly MIN_GUESTS = MIN_GUESTS;
  readonly MAX_GUESTS = MAX_GUESTS;

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

  onMyReservations(): void {
    this.isDropdownOpen.set(false);
    this.myReservationsClicked.emit();
  }

  onLogout(): void {
    this.isDropdownOpen.set(false);
    this.logoutClicked.emit();
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  onCheckInChange(value: string | number | null): void {
    this.checkIn.set(typeof value === 'string' ? value : undefined);
  }

  onCheckOutChange(value: string | number | null): void {
    this.checkOut.set(typeof value === 'string' ? value : undefined);
  }

  incrementGuests(): void {
    if (this.guests() < MAX_GUESTS) {
      this.guests.update((v) => v + 1);
    }
  }

  decrementGuests(): void {
    if (this.guests() > MIN_GUESTS) {
      this.guests.update((v) => v - 1);
    }
  }

  onSearch(): void {
    this.search.emit({
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      guests: this.guests(),
    });
  }
}
