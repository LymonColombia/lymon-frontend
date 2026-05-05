import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { bootstrapClipboard2Check, bootstrapPerson, bootstrapSearch } from '@ng-icons/bootstrap-icons';


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

    readonly categoryFilter = signal<string | undefined>(undefined);
    readonly ownerTypeFilter = signal<string | undefined>(undefined);

    readonly categoryOptions:  SelectOption[] = [
        { value: 1, label: 'all' },
        { value: 2, label: 'Gastronomia' },
        { value: 3, label: 'Cultura' },
        { value: 4, label: 'Naturaleza' },
        { value: 5, label: 'Aventura' },
      ];
    readonly ownerTypeOptions:  SelectOption[] = [
        { value: 1, label: 'all' },
        { value: 2, label: 'Agencia' },
        { value: 3, label: 'Host' },
      ];

    onCategoryFilterChange(value: string | number | null): void {
      this.categoryFilter.set(typeof value === 'string' ? value : undefined)
    }

    onOwnerTypeFilterChange(value: string | number | null): void {
       this.ownerTypeFilter.set(typeof value === 'string' ? value : undefined)
    }

  
}
