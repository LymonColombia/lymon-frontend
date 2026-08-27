import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapGrid, bootstrapListUl, bootstrapPlus, bootstrapStars } from '@ng-icons/bootstrap-icons';

import {
  TenantPageActionsDirective,
  TenantPageLayoutComponent,
  TenantPageMetaDirective,
} from '@/presentation/tenant/layout/tenant-page-layout/tenant-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { ModalComponent } from '@/presentation/shared/components/modal/modal';
import { ExperienceCardComponent } from '../../components/experience-card/experience-card';
import { ExperienceTableComponent } from '../../components/experience-table/experience-table';
import { GetExperiencesUseCase } from '@/domain/use-cases/experience/get-experiences.use-case';
import { DeleteExperienceUseCase } from '@/domain/use-cases/experience/delete-experience.use-case';
import { Experience } from '@/domain/entities/experience.model';

type ExperienceViewMode = 'CARDS' | 'TABLE';

@Component({
  selector: 'app-tenant-experiences-page',
  standalone: true,
  imports: [
    TenantPageLayoutComponent,
    TenantPageMetaDirective,
    TenantPageActionsDirective,
    ButtonComponent,
    ModalComponent,
    ExperienceCardComponent,
    ExperienceTableComponent,
    NgIcon,
],
  providers: [provideIcons({ bootstrapStars, bootstrapPlus, bootstrapGrid, bootstrapListUl})],
  templateUrl: './experience-list.html',
  styleUrl: './experience-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperiencesPageComponent {
  private readonly router = inject(Router);
  private readonly getExperiencesUseCase = inject(GetExperiencesUseCase);
  private readonly deleteExperienceUseCase = inject(DeleteExperienceUseCase);
  readonly isLoading = signal(true);
  readonly isDeleting = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly experiences = signal<Experience[]>([]);
  readonly experienceToDelete = signal<Experience | null>(null);
  readonly viewMode = signal<ExperienceViewMode>('CARDS');
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

  onDeleteExperience(id: string): void {
    const experience = this.experiences().find((item) => item.id === id);
    if (!experience) {
      return;
    }

    this.experienceToDelete.set(experience);
    this.showDeleteConfirm.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
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

  cancelDeleteExperience(): void {
    this.showDeleteConfirm.set(false);
    this.experienceToDelete.set(null);
  }

  confirmDeleteExperience(): void {
    const experience = this.experienceToDelete();
    const experienceId = experience?.id;
    if (!experience || !experienceId) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set(null);
    this.deleteExperienceUseCase.execute(experienceId).subscribe({
      next: () => {
        this.experiences.set(this.experiences().filter((item) => item.id !== experienceId));
        this.isDeleting.set(false);
        this.cancelDeleteExperience();
        this.successMessage.set('Experiencia eliminada correctamente.');
      },
      error: () => {
        this.isDeleting.set(false);
        this.errorMessage.set('No se pudo eliminar la experiencia.');
      },
    });
  }

  private loadExperiences(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getExperiencesUseCase.execute().subscribe({
      next: (experiences) => {
        this.experiences.set(experiences);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las experiencias.');
        this.isLoading.set(false);
      },
    });
  }
}
