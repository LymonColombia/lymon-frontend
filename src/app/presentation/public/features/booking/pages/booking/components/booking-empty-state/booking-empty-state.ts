import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapSearch } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'booking-empty-state',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapSearch })],
  templateUrl: './booking-empty-state.html',
  styleUrl: './booking-empty-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingEmptyStateComponent {}
