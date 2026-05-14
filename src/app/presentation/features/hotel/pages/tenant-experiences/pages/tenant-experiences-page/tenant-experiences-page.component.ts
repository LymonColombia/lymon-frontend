import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapGrid, bootstrapListUl, bootstrapPlus, bootstrapStars } from '@ng-icons/bootstrap-icons';
import { Experience} from '@/domain/entities/experience.model';
import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ExperienceCardComponent } from '../../components/experience-card/experience-card.component';
import { ExperienceTableComponent } from '../../components/experience-table/experience-table.component';
import { GetExperiencesUseCase } from '@/domain/use-cases/experience/get-experiences.use-case';
import { DeleteExperienceUseCase } from '@/domain/use-cases/experience/delete-experience.use-case';

type ExperienceViewMode = 'CARDS' | 'TABLE';

@Component({
  selector: 'app-tenant-experiences-page',
  standalone: true,
  imports: [
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    HotelPageActionsDirective,
    ButtonComponent,
    ExperienceCardComponent,
    ExperienceTableComponent,
    NgIcon
],
  providers: [provideIcons({ bootstrapStars, bootstrapPlus, bootstrapGrid, bootstrapListUl })],
  templateUrl: './tenant-experiences-page.component.html',
  styleUrl: './tenant-experiences-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperiencesPageComponent {
  private readonly router = inject(Router);
  private readonly getExperiencesUseCase = inject(GetExperiencesUseCase);
  private readonly deleteExperienceUseCase = inject(DeleteExperienceUseCase);
  
  private readonly experienceToDelete = signal<string | null>(null);


  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly experiences = signal<Experience[]>([]);
  readonly viewMode = signal<ExperienceViewMode>('CARDS');
  readonly IdEditingExperience = signal<string | null>(null);


  readonly experienceCountLabel = computed(() => {
    if (this.isLoading()) {
      return 'Cargando experiencias...';
    }

    const count = this.experiences().length;
    return `${count} experiencia${count === 1 ? '' : 's'} registradas`;
  });

  constructor() {
    this.loadExperiences();
  }

  setViewMode(mode: ExperienceViewMode): void {
    this.viewMode.set(mode);
  }

  onDeleteExperience(id: string) {
    this.experienceToDelete.set(id);
  }

  onCreateExperience(): void {
    this.router.navigate(['/tenant-experiences/new']);
  }

  onViewExperience(id: string): void {
    this.router.navigate(['/tenant-experiences', id]);
  }

  onEditExperience(id:string): void {
    this.router.navigate(['/tenant-experiences', id, 'edit']);
  }

  private loadExperiences(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getExperiencesUseCase.execute().subscribe({
      next: (experiences) => {
        this.experiences.set(experiences);
        this.isLoading.set(false);
        console.log('Experiencias cargadas:', experiences);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las experiencias.');
        this.isLoading.set(false);
      },
    });
  }

  private deleteExperience(id: string): void {
    this.deleteExperienceUseCase.execute(id).subscribe({
      next: () => {
        this.experiences.set(this.experiences().filter(exp => exp.id !== id));
        this.experienceToDelete.set(null);
      },
      error: () => {
        this.errorMessage.set('No se pudo eliminar la experiencia.');
        this.experienceToDelete.set(null);
      },
    });
}
}
