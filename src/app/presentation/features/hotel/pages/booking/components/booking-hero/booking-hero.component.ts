import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCalendar, bootstrapPeopleFill, bootstrapSearch } from '@ng-icons/bootstrap-icons';

export interface BookingSearchParams {
  startDate?: string;
  endDate?: string;
  minGuests?: number;
}

const MIN_GUESTS = 1;
const MAX_GUESTS = 10;

@Component({
  selector: 'booking-hero',
  standalone: true,
  imports: [InputComponent, NgIcon],
  providers: [provideIcons({ bootstrapCalendar, bootstrapPeopleFill, bootstrapSearch })],
  templateUrl: './booking-hero.component.html',
  styleUrl: './booking-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingHeroComponent {
  readonly search = output<BookingSearchParams>();

  readonly startDate = signal<string | undefined>(undefined);
  readonly endDate = signal<string | undefined>(undefined);
  readonly minGuests = signal<number>(MIN_GUESTS);

  readonly MIN_GUESTS = MIN_GUESTS;
  readonly MAX_GUESTS = MAX_GUESTS;

  onStartDateChange(value: string | number | null): void {
    this.startDate.set(typeof value === 'string' ? value : undefined);
  }

  onEndDateChange(value: string | number | null): void {
    this.endDate.set(typeof value === 'string' ? value : undefined);
  }

  incrementGuests(): void {
    if (this.minGuests() < MAX_GUESTS) {
      this.minGuests.update(v => v + 1);
    }
  }

  decrementGuests(): void {
    if (this.minGuests() > MIN_GUESTS) {
      this.minGuests.update(v => v - 1);
    }
  }

  onSearch(): void {
    this.search.emit({
      startDate: this.startDate(),
      endDate: this.endDate(),
      minGuests: this.minGuests(),
    });
  }
}
