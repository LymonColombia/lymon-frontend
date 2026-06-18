import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapClipboard2Check, bootstrapGeoAlt, bootstrapSearch } from '@ng-icons/bootstrap-icons';
import { ExperienceCategoryFilter } from '../experience-toolbar/experience-toolbar.component';

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
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedCategory = input<ExperienceCategoryFilter>(null);
  readonly filtersApply = output<ExperienceHeroFilters>();

  readonly categoryFilter = signal<ExperienceCategoryFilter>(null);

  readonly categoryOptions: SelectOption[] = [
    { value: '', label: 'Todas las categorias' },
    { value: 'TRANSPORTATION' , label: 'Transporte' },
  ];

  constructor() {
    effect(() => {
      this.categoryFilter.set(this.selectedCategory());
    });

  }

  onCategoryFilterChange(value: string | number | null): void {
    this.categoryFilter.set((typeof value === 'string' ? value : null) as ExperienceCategoryFilter);
  }

  onSearch(): void {
  this.filtersApply.emit({
    category: this.categoryFilter(),
  });
}

}