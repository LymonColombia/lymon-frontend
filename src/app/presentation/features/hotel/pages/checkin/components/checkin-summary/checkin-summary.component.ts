import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface CheckinSummaryData {
  guestName: string;
  room: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: string;
}

@Component({
  selector: 'app-checkin-summary',
  standalone: true,
  imports: [],
  templateUrl: './checkin-summary.component.html',
  styleUrl: './checkin-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinSummaryComponent {
  readonly isLoading = input.required<boolean>();
  readonly error = input<string | null>(null);
  readonly summary = input.required<CheckinSummaryData>();
}
