import { ChangeDetectionStrategy, Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
  imports: [InputComponent, ReactiveFormsModule, NgIcon],
  providers: [provideIcons({ bootstrapCalendar, bootstrapPeopleFill, bootstrapSearch })],
  templateUrl: './booking-hero.component.html',
  styleUrl: './booking-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingHeroComponent implements OnInit {
  readonly initialStartDate = input<string | undefined>(undefined);
  readonly initialEndDate = input<string | undefined>(undefined);
  readonly initialMinGuests = input<number | undefined>(undefined);

  readonly search = output<BookingSearchParams>();

  readonly checkInControl = new FormControl<string | null>(null);
  readonly checkOutControl = new FormControl<string | null>(null);
  readonly minGuests = signal<number>(MIN_GUESTS);

  readonly MIN_GUESTS = MIN_GUESTS;
  readonly MAX_GUESTS = MAX_GUESTS;

  ngOnInit(): void {
    this.checkInControl.setValue(this.initialStartDate() ?? null);
    this.checkOutControl.setValue(this.initialEndDate() ?? null);
    this.minGuests.set(this.initialMinGuests() ?? MIN_GUESTS);
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
      startDate: this.checkInControl.value ?? undefined,
      endDate: this.checkOutControl.value ?? undefined,
      minGuests: this.minGuests(),
    });
  }
}
