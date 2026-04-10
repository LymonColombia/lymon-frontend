import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxArrowInRight,
  bootstrapBoxArrowRight,
  bootstrapCalendar2Check,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

@Component({
  selector: 'booking-nav',
  standalone: true,
  imports: [ButtonComponent, NgOptimizedImage, NgIcon, RouterModule],
  providers: [provideIcons({ bootstrapBoxArrowInRight, bootstrapBoxArrowRight, bootstrapCalendar2Check })],
  templateUrl: './booking-nav.component.html',
  styleUrl: './booking-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingNavComponent {
  readonly isAuthenticated = input.required<boolean>();
  readonly guestName = input<string | null>(null);
  readonly loginClicked = output<void>();
  readonly logoutClicked = output<void>();
  readonly myReservationsClicked = output<void>();
}
