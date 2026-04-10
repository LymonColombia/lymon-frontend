import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapSearch, bootstrapX } from '@ng-icons/bootstrap-icons';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';

export type BookingSortOption = 'price-asc' | 'price-desc' | 'rating';

@Component({
  selector: 'booking-toolbar',
  standalone: true,
  imports: [NgIcon, SelectComponent],
  providers: [provideIcons({ bootstrapSearch, bootstrapX })],
  templateUrl: './booking-toolbar.component.html',
  styleUrl: './booking-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingToolbarComponent {
  readonly resultsCount = input.required<number>();
  readonly sortBy = input.required<BookingSortOption>();

  readonly searchQueryChange = output<string>();
  readonly sortChange = output<BookingSortOption>();

  readonly internalQuery = signal('');

  readonly sortOptions: SelectOption[] = [
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
  ];

  onQueryInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.internalQuery.set(value);
    this.searchQueryChange.emit(value);
  }

  clearQuery(): void {
    this.internalQuery.set('');
    this.searchQueryChange.emit('');
  }

  onSortChange(value: string | number): void {
    this.sortChange.emit(value as BookingSortOption);
  }
}
