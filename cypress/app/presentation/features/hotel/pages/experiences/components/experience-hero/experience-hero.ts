import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { bootstrapClipboard2Check, bootstrapPerson, bootstrapSearch } from '@ng-icons/bootstrap-icons';
import {
  ExperienceCategoryFilter,
  ExperienceOwnerTypeFilter,
} from '../experience-toolbar/experience-toolbar.component';

export interface ExperienceHeroFilters {
  category: ExperienceCategoryFilter;
  ownerType: ExperienceOwnerTypeFilter;
}


@Component({
  selector: 'experience-hero',
  standalone: true,
  templateUrl: './experience-hero.html',
  styleUrl: './experience-hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectComponent, NgIcon],
  providers: [provideIcons({ bootstrapSearch , bootstrapClipboard2Check,bootstrapPerson})],

})
export class ExperienceHeroComponent {
    readonly selectedCategory = input<ExperienceCategoryFilter>('all');
    readonly selectedOwnerType = input<ExperienceOwnerTypeFilter>('all');
    readonly filtersApply = output<ExperienceHeroFilters>();

    readonly categoryFilter = signal<ExperienceCategoryFilter>('all');
    readonly ownerTypeFilter = signal<ExperienceOwnerTypeFilter>('all');

    constructor() {
      effect(() => {
        this.categoryFilter.set(this.selectedCategory());
        this.ownerTypeFilter.set(this.selectedOwnerType());
      });
    }

    readonly categoryOptions:  SelectOption[] = [
        { value: 'all', label: 'Todas las categorias' },
        { value: 'Gastronomia', label: 'Gastronomia' },
        { value: 'Cultura', label: 'Cultura' },
        { value: 'Naturaleza', label: 'Naturaleza' },
        { value: 'Aventura', label: 'Aventura' },
      ];
    readonly ownerTypeOptions:  SelectOption[] = [
        { value: 'all', label: 'Todos los propietarios' },
        { value: 'Agencia', label: 'Agencia' },
        { value: 'Host', label: 'Host' },
        { value: 'Guia certificado', label: 'Guia certificado' },
      ];

    onCategoryFilterChange(value: string | number | null): void {
      this.categoryFilter.set((typeof value === 'string' ? value : 'all') as ExperienceCategoryFilter);
    }

    onOwnerTypeFilterChange(value: string | number | null): void {
       this.ownerTypeFilter.set((typeof value === 'string' ? value : 'all') as ExperienceOwnerTypeFilter);
    }

    onSearch(): void {
      this.filtersApply.emit({
        category: this.categoryFilter(),
        ownerType: this.ownerTypeFilter(),
      });
    }
  
}
