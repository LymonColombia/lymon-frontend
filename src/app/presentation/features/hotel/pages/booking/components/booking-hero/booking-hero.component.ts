import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCalendar, bootstrapPeopleFill, bootstrapSearch } from '@ng-icons/bootstrap-icons';

export interface BookingSearchParams {
  startDate?: string;
  endDate?: string;
  minGuests?: number;
}

@Component({
  selector: 'booking-hero',
  standalone: true,
  imports: [InputComponent, SelectComponent, NgIcon],
  providers: [provideIcons({ bootstrapCalendar, bootstrapPeopleFill, bootstrapSearch })],
  templateUrl: './booking-hero.component.html',
  styleUrl: './booking-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingHeroComponent {
  readonly search = output<BookingSearchParams>();

  readonly startDate = signal<string | undefined>(undefined);
  readonly endDate = signal<string | undefined>(undefined);
  readonly minGuests = signal<number | undefined>(undefined);

  readonly guestOptions: SelectOption[] = [
    { value: 1, label: '1 Huésped' },
    { value: 2, label: '2 Huéspedes' },
    { value: 3, label: '3 Huéspedes' },
    { value: 4, label: '4 Huéspedes' },
    { value: 5, label: '5+ Huéspedes' },
  ];

  onStartDateChange(value: string | number | null): void {
    this.startDate.set(typeof value === 'string' ? value : undefined);
  }

  onEndDateChange(value: string | number | null): void {
    this.endDate.set(typeof value === 'string' ? value : undefined);
  }

  onMinGuestsChange(value: string | number | null): void {
    this.minGuests.set(typeof value === 'number' ? value : undefined);
  }

  onSearch(): void {
    this.search.emit({
      startDate: this.startDate(),
      endDate: this.endDate(),
      minGuests: this.minGuests(),
    });
  }
}
