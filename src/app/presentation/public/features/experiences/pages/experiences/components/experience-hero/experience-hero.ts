import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapClipboard2Check, bootstrapGeoAlt, bootstrapSearch } from '@ng-icons/bootstrap-icons';
import { ExperienceCategoryFilter } from '../experience-toolbar/experience-toolbar';

export interface ExperienceHeroFilters {
  category: ExperienceCategoryFilter;
}

@Component({
  selector: 'experience-hero',
  standalone: true,
  templateUrl: './experience-hero.html',
  styleUrl: './experience-hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectComponent, NgIcon],
  providers: [provideIcons({ bootstrapSearch, bootstrapClipboard2Check, bootstrapGeoAlt })],
})
export class ExperienceHeroComponent {
  readonly selectedCategory = input<ExperienceCategoryFilter>(null);
  readonly filtersApply = output<ExperienceHeroFilters>();

  readonly categoryFilter = signal<ExperienceCategoryFilter>(null);

  readonly categoryOptions: SelectOption[] = [
    { value: '', label: 'Todas las categorias' },
    { value: 'TRANSPORTATION' , label: 'Transporte' },
  ];

  constructor() {
    effect(() => {
      this.categoryFilter.set(this.selectedCategory() ?? null);
    });
  }

  onCategoryFilterChange(value: string | number | null): void {
    if (typeof value !== 'string' || value === '') {
      this.categoryFilter.set(null);
      return;
    }

    this.categoryFilter.set(value as ExperienceCategoryFilter);
  }

  onSearch(): void {
    this.filtersApply.emit({
      category: this.categoryFilter() ?? null,
    });
  }

}
