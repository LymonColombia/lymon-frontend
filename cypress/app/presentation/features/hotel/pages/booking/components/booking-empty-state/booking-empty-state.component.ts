import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapSearch } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'booking-empty-state',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapSearch })],
  templateUrl: './booking-empty-state.component.html',
  styleUrl: './booking-empty-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingEmptyStateComponent {}
