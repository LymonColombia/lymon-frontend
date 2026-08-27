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
  templateUrl: './checkin-summary.html',
  styleUrl: './checkin-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinSummaryComponent {
  readonly isLoading = input.required<boolean>();
  readonly error = input<string | null>(null);
  readonly summary = input.required<CheckinSummaryData>();
}
