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
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxArrowRight,
  bootstrapCalendar2Check,
  bootstrapChevronDown,
  bootstrapChevronLeft,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-guest-nav',
  standalone: true,
  imports: [NgIcon, RouterLink],
  providers: [
    provideIcons({
      bootstrapBoxArrowRight,
      bootstrapCalendar2Check,
      bootstrapChevronDown,
      bootstrapChevronLeft,
    }),
  ],
  templateUrl: './guest-nav.html',
  styleUrl: './guest-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class GuestNavComponent {
  private readonly elementRef = inject(ElementRef);

  readonly guestEmail = input<string>('');
  readonly backButtonLabel = input<string>('Explorar');

  readonly explore = output<void>();
  readonly logout = output<void>();

  readonly isDropdownOpen = signal(false);

  readonly initials = computed(() => {
    const email = this.guestEmail().trim();
    if (!email) return '?';

    const [localPart] = email.split('@');
    if (!localPart) return '?';

    return localPart.slice(0, 2).toUpperCase();
  });

  readonly profileLabel = computed(() => {
    const email = this.guestEmail().trim();
    if (!email) {
      return 'Guest';
    }

    const [localPart] = email.split('@');
    if (!localPart) {
      return email;
    }

    return localPart;
  });

  onExplore(): void {
    this.explore.emit();
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update((v) => !v);
  }

  onLogout(): void {
    this.isDropdownOpen.set(false);
    this.logout.emit();
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }
}
