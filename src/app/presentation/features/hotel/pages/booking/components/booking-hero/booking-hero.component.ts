import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCalendar, bootstrapPeopleFill, bootstrapSearch } from '@ng-icons/bootstrap-icons';

export interface BookingSearchParams {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
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

  readonly checkIn = signal<string | undefined>(undefined);
  readonly checkOut = signal<string | undefined>(undefined);
  readonly guests = signal<number | undefined>(undefined);

  readonly guestOptions: SelectOption[] = [
    { value: 1, label: '1 Huésped' },
    { value: 2, label: '2 Huéspedes' },
    { value: 3, label: '3 Huéspedes' },
    { value: 4, label: '4 Huéspedes' },
    { value: 5, label: '5+ Huéspedes' },
  ];

  onCheckInChange(value: string | number | null): void {
    this.checkIn.set(typeof value === 'string' ? value : undefined);
  }

  onCheckOutChange(value: string | number | null): void {
    this.checkOut.set(typeof value === 'string' ? value : undefined);
  }

  onGuestsChange(value: string | number | null): void {
    this.guests.set(typeof value === 'number' ? value : undefined);
  }

  onSearch(): void {
    this.search.emit({
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      guests: this.guests(),
    });
  }
}
