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
  bootstrapCalendar2Check,
  bootstrapChevronDown,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

@Component({
  selector: 'booking-nav',
  standalone: true,
  imports: [ButtonComponent, NgOptimizedImage, NgIcon, RouterModule],
  providers: [
    provideIcons({
      bootstrapBoxArrowInRight,
      bootstrapBoxArrowRight,
      bootstrapCalendar2Check,
      bootstrapChevronDown,
    }),
  ],
  templateUrl: './booking-nav.component.html',
  styleUrl: './booking-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class BookingNavComponent {
  private readonly elementRef = inject(ElementRef);

  readonly isAuthenticated = input.required<boolean>();
  readonly guestEmail = input<string | null>(null);

  readonly loginClicked = output<void>();
  readonly logoutClicked = output<void>();
  readonly myReservationsClicked = output<void>();

  readonly isDropdownOpen = signal(false);

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
}
