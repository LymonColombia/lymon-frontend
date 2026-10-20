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
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxArrowRight,
  bootstrapCalendar2Check,
  bootstrapChevronDown,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-profile-menu',
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapBoxArrowRight, bootstrapCalendar2Check, bootstrapChevronDown })],
  templateUrl: './profile-menu.html',
  styleUrl: './profile-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ProfileMenuComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly email = input<string | null>(null);

  readonly logoutClicked = output<void>();
  readonly myReservationsClicked = output<void>();

  readonly isDropdownOpen = signal(false);

  private readonly localPart = computed(() => (this.email() ?? '').trim().split('@')[0]);

  readonly initials = computed(() => this.localPart().slice(0, 2).toUpperCase() || '?');

  readonly profileLabel = computed(() => {
    const email = (this.email() ?? '').trim();
    if (!email) return 'Guest';
    return this.localPart() || email;
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
    if (!this.elementRef.nativeElement.contains(event.target as Node | null)) {
      this.isDropdownOpen.set(false);
    }
  }
}
