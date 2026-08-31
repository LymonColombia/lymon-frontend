import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapSearch, bootstrapX } from '@ng-icons/bootstrap-icons';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select';

export type ExperienceSortOption = 'asc' | 'desc' | undefined;
export type ExperienceCategoryFilter = null | 'TRANSPORTATION' ;

@Component({
  selector: 'experience-toolbar',
  standalone: true,
  imports: [NgIcon, SelectComponent],
  providers: [provideIcons({ bootstrapSearch, bootstrapX })],
  templateUrl: './experience-toolbar.html',
  styleUrl: './experience-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceToolbarComponent {
  readonly resultsCount = input.required<number>();
  readonly sortBy = input.required<ExperienceSortOption>();
  readonly selectedCategory = input<ExperienceCategoryFilter>(null);

  readonly searchQueryChange = output<string>();
  readonly sortChange = output<ExperienceSortOption>();
  readonly categoryChange = output<ExperienceCategoryFilter>();

  readonly internalQuery = signal('');

  readonly sortOptions: SelectOption[] = [
    { value: '', label: 'Mejor valorados' },
    { value: 'asc', label: 'Precio: menor a mayor' },
    { value: 'desc', label: 'Precio: mayor a menor' },
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
    if (value === 'asc' || value === 'desc') {
      this.sortChange.emit(value);
      return;
    }

    this.sortChange.emit(undefined);
  }

  onCategoryChange(value: string | number): void {
    if (value === 'TRANSPORTATION') {
      this.categoryChange.emit(value);
      return;
    }

    this.categoryChange.emit(null);
  }

}
