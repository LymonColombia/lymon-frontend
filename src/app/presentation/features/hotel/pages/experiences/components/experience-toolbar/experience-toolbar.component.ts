import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapSearch, bootstrapX } from '@ng-icons/bootstrap-icons';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';

export type ExperienceSortOption = 'price-asc' | 'price-desc' | 'rating';
export type ExperienceCategoryFilter = 'all' | 'Aventura' | 'Naturaleza' | 'Cultura' | 'Gastronomia';
export type ExperienceOwnerTypeFilter = 'all' | 'Host' | 'Agencia' | 'Guia certificado';

@Component({
  selector: 'experience-toolbar',
  standalone: true,
  imports: [NgIcon, SelectComponent],
  providers: [provideIcons({ bootstrapSearch, bootstrapX })],
  templateUrl: './experience-toolbar.component.html',
  styleUrl: './experience-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceToolbarComponent {
  readonly resultsCount = input.required<number>();
  readonly sortBy = input.required<ExperienceSortOption>();
  readonly selectedCategory = input<ExperienceCategoryFilter>('all');
  readonly selectedOwnerType = input<ExperienceOwnerTypeFilter>('all');

  readonly searchQueryChange = output<string>();
  readonly sortChange = output<ExperienceSortOption>();
  readonly categoryChange = output<ExperienceCategoryFilter>();
  readonly ownerTypeChange = output<ExperienceOwnerTypeFilter>();

  readonly internalQuery = signal('');

  readonly sortOptions: SelectOption[] = [
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
  ];

  readonly categoryOptions: SelectOption[] = [
    { value: 'all', label: 'Todas las categorias' },
    { value: 'Aventura', label: 'Aventura' },
    { value: 'Naturaleza', label: 'Naturaleza' },
    { value: 'Cultura', label: 'Cultura' },
    { value: 'Gastronomia', label: 'Gastronomia' },
  ];

  readonly ownerTypeOptions: SelectOption[] = [
    { value: 'all', label: 'Todos los hosts' },
    { value: 'Host', label: 'Host' },
    { value: 'Agencia', label: 'Agencia' },
    { value: 'Guia certificado', label: 'Guia certificado' },
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
    this.sortChange.emit(value as ExperienceSortOption);
  }

  onCategoryChange(value: string | number): void {
    this.categoryChange.emit(value as ExperienceCategoryFilter);
  }

  onOwnerTypeChange(value: string | number): void {
    this.ownerTypeChange.emit(value as ExperienceOwnerTypeFilter);
  }
}
