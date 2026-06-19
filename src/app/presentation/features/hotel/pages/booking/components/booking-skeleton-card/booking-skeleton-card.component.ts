import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'booking-skeleton-card',
  standalone: true,
  templateUrl: './booking-skeleton-card.component.html',
  styleUrl: './booking-skeleton-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSkeletonCardComponent {}
