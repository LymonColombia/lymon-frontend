import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapGrid, bootstrapListUl, bootstrapPlus, bootstrapStar } from '@ng-icons/bootstrap-icons';

import {
  HotelPageActionsDirective,
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { BookingPaginationComponent } from '@/presentation/features/hotel/pages/booking/components/booking-pagination/booking-pagination.component';
import { ExperienceCardComponent } from '../../components/experience-card/experience-card.component';
import { ExperienceTableComponent } from '../../components/experience-table/experience-table.component';
import { GetExperiencesUseCase } from '@/domain/use-cases/experience/get-experiences.use-case';
import { DeleteExperienceUseCase } from '@/domain/use-cases/experience/delete-experience.use-case';
import { Experience } from '@/domain/entities/experience.model';

const ITEMS_PER_PAGE = 12;

type ExperienceViewMode = 'CARDS' | 'TABLE';

@Component({
  selector: 'app-tenant-experiences-page',
  standalone: true,
  imports: [
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    HotelPageActionsDirective,
    ButtonComponent,
    ModalComponent,
    BookingPaginationComponent,
    ExperienceCardComponent,
    ExperienceTableComponent,
    NgIcon,
],
  providers: [provideIcons({ bootstrapStar, bootstrapPlus, bootstrapGrid, bootstrapListUl})],
  templateUrl: './tenant-experiences-page.component.html',
  styleUrl: './tenant-experiences-page.component.css',
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
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly experienceCountLabel = computed(() => {
    if (this.isLoading()) {
      return 'Cargando experiencias...';
    }

    const count = this.totalCount();
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
        this.isDeleting.set(false);
        this.cancelDeleteExperience();
        this.successMessage.set('Experiencia eliminada correctamente.');
        this.loadExperiences(this.currentPage());
        this.successMessage.set(null)
      },
      error: () => {
        this.isDeleting.set(false);
        this.errorMessage.set('No se pudo eliminar la experiencia.');
      },
    });
  }

  onPageChange(page: number): void {
    this.loadExperiences(page);
  }

  private loadExperiences(page = 1): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.getExperiencesUseCase.execute({ page, limit: ITEMS_PER_PAGE }).subscribe({
      next: ({ experiences, pagination }) => {
        this.experiences.set(experiences);
        this.currentPage.set(pagination.page);
        this.totalPages.set(pagination.totalPages);
        this.totalCount.set(pagination.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las experiencias.');
        this.isLoading.set(false);
      },
    });
  }
}
