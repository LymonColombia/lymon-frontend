import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapGrid, bootstrapListUl, bootstrapPlus, bootstrapStar, bootstrapStars } from '@ng-icons/bootstrap-icons';
import { forkJoin, map, of, switchMap } from 'rxjs';

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
import { ExperienceFormComponent } from '../../components/experience-form/experience-form.component';
import { SelectOption } from '@/presentation/shared/components/select/select.component';
import { GetExperiencesUseCase } from '@/domain/use-cases/experience/get-experiences.use-case';
import { DeleteExperienceUseCase } from '@/domain/use-cases/experience/delete-experience.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetExperienceByIdUseCase } from '@/domain/use-cases/experience/get-experience-by-id.use-case';
import { CreateExperienceUseCase } from '@/domain/use-cases/experience/create-experience.use-case';
import { UpdateExperienceUseCase } from '@/domain/use-cases/experience/update-experience.use-case';
import { CreateImageStorageUseCase } from '@/domain/use-cases/image-storage/image-storage.use-case';
import { ExperienceFormSubmitPayload } from '../../models/experience-form.model';
import { getExperienceSaveErrorMessage } from '@/domain/constants/experience-messages.constants';
import { CreateExperienceDto, UpdateExperienceDto,Experience } from '@/domain/entities/experience.model';

const ITEMS_PER_PAGE = 12;

type ExperienceViewMode = 'CARDS' | 'TABLE';
type ExperienceModalMode = 'create' | 'edit';

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
    ExperienceFormComponent,
    NgIcon,
  ],
  providers: [provideIcons({ bootstrapStar, bootstrapStars, bootstrapPlus, bootstrapGrid, bootstrapListUl })],
  templateUrl: './tenant-experiences-page.component.html',
  styleUrl: './tenant-experiences-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperiencesPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getExperiencesUseCase = inject(GetExperiencesUseCase);
  private readonly deleteExperienceUseCase = inject(DeleteExperienceUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getExperienceByIdUseCase = inject(GetExperienceByIdUseCase);
  private readonly createExperienceUseCase = inject(CreateExperienceUseCase);
  private readonly updateExperienceUseCase = inject(UpdateExperienceUseCase);
  private readonly createImageStorageUseCase = inject(CreateImageStorageUseCase);

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
  readonly propertyOptions = signal<SelectOption[]>([]);
  readonly experienceModalOpen = signal(false);
  readonly experienceModalMode = signal<ExperienceModalMode>('create');
  readonly experienceModalLoading = signal(false);
  //readonly experienceModalLoadError = signal<string | null>(null);
  readonly experienceModalSaveError = signal<string | null>(null);
  readonly selectedExperience = signal<Experience | null>(null);
  readonly isSavingExperience = signal(false);

  readonly experienceCountLabel = computed(() => {
    if (this.isLoading()) {
      return 'Cargando experiencias...';
    }

    const count = this.totalCount();
    return `${count} experiencia${count === 1 ? '' : 's'} registradas`;
  });

  readonly experienceModalTitle = computed(() =>
    this.experienceModalMode() === 'edit' ? 'Editar experiencia' : 'Nueva experiencia',
  );

  constructor() {
    this.loadExperiences();
    this.loadProperties();
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const modal = params.get('modal');
      const experienceId = params.get('id');

      if (modal === 'create') {
        this.openCreateExperienceModalState();
        return;
      }

      if (modal === 'edit' && experienceId) {
        this.openEditExperienceModalState(experienceId);
        return;
      }

      this.resetExperienceModalState();
    });
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
    this.router.navigate(['/tenant-experiences'], {
      queryParams: { modal: 'create' },
    });
  }

  onViewExperience(id: string): void {
    this.router.navigate(['/tenant-experiences', id]);
  }

  onEditExperience(id: string): void {
    this.router.navigate(['/tenant-experiences'], {
      queryParams: { modal: 'edit', id },
    });
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
      },
      error: () => {
        this.isDeleting.set(false);
        this.errorMessage.set('No se pudo eliminar la experiencia.');
      },
    });
  }

  onExperienceFormCancelled(): void {
    this.closeExperienceModal();
  }

  onExperienceFormSubmitted(payload: ExperienceFormSubmitPayload): void {
    const editingExperienceId = this.selectedExperience()?.id;

    this.isSavingExperience.set(true);
    this.experienceModalSaveError.set(null);

    const coverKey$ = payload.coverImageFile
      ? this.uploadExperienceMedia(payload.coverImageFile)
      : of<string | undefined>(payload.existingCoverKey ?? undefined);

    const newMediaKeys$ = payload.newMediaFiles.length
      ? forkJoin(payload.newMediaFiles.map((file) => this.uploadExperienceMedia(file)))
      : of<string[]>([]);

    forkJoin({ coverKey: coverKey$, newMediaKeys: newMediaKeys$ })
      .pipe(
        switchMap(({ coverKey, newMediaKeys }) => {
          const mediaKeys = [
            ...(coverKey ? [coverKey] : []),
            ...payload.keptMediaItems.map((item) => item.key),
            ...newMediaKeys,
          ];

          if (editingExperienceId) {
            return this.updateExperienceUseCase.execute(
              editingExperienceId,
              this.toUpdateExperienceDto(payload.experience, mediaKeys),
            );
          }

          return this.createExperienceUseCase.execute({
            ...payload.experience,
            mediaKeys,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSavingExperience.set(false);
          this.successMessage.set('Experiencia guardada correctamente.');
          this.closeExperienceModal();
          this.loadExperiences(this.currentPage());
        },
        error: (error) => {
          this.isSavingExperience.set(false);
          this.experienceModalSaveError.set(
            getExperienceSaveErrorMessage(error) || 'No se pudo guardar la experiencia.',
          );
        },
      });
  }

  onPageChange(page: number): void {
    this.loadExperiences(page);
  }

  closeExperienceModal(): void {
    this.resetExperienceModalState();
    this.router.navigate(['/tenant-experiences'], { replaceUrl: true });
  }

  private loadProperties(): void {
    this.getPropertiesUseCase.execute().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (properties) => {
        this.propertyOptions.set(this.transformToSelectOptions(properties));
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las propiedades.');
      },
    });
  }

  private transformToSelectOptions(items: { id: string; name: string }[]): SelectOption[] {
    return items.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  }

  private openCreateExperienceModalState(): void {
    this.currentModalLoadToken = null;
    this.experienceModalMode.set('create');
    this.experienceModalOpen.set(true);
    this.experienceModalLoading.set(false);
    //this.experienceModalLoadError.set(null);
    this.experienceModalSaveError.set(null);
    this.selectedExperience.set(null);
  }

  private openEditExperienceModalState(experienceId: string): void {
    this.experienceModalMode.set('edit');
    this.experienceModalOpen.set(true);
    this.experienceModalLoading.set(true);
    //this.experienceModalLoadError.set(null);
    this.experienceModalSaveError.set(null);
    this.selectedExperience.set(null);

    const loadToken = Symbol('experience-modal-load');
    this.currentModalLoadToken = loadToken;

    this.getExperienceByIdUseCase
      .execute(experienceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (experience) => {
          if (this.currentModalLoadToken !== loadToken) {
            return;
          }

          if (!experience) {
            //this.experienceModalLoadError.set('No se encontró la experiencia solicitada.');
            this.experienceModalLoading.set(false);
            return;
          }

          this.selectedExperience.set(experience);
          this.experienceModalLoading.set(false);
        },
        error: () => {
          if (this.currentModalLoadToken !== loadToken) {
            return;
          }

          //this.experienceModalLoadError.set('No se pudo cargar la experiencia para edición.');
          this.experienceModalLoading.set(false);
        },
      });
  }

  private resetExperienceModalState(): void {
    this.currentModalLoadToken = null;
    this.experienceModalOpen.set(false);
    this.experienceModalMode.set('create');
    this.experienceModalLoading.set(false);
    //this.experienceModalLoadError.set(null);
    this.experienceModalSaveError.set(null);
    this.selectedExperience.set(null);
    this.isSavingExperience.set(false);
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

  private uploadExperienceMedia(file: File) {
    return this.createImageStorageUseCase
      .execute({ file, category: 'experiences' })
      .pipe(map(({ key }) => key));
  }

  private toUpdateExperienceDto(dto: CreateExperienceDto, mediaKeys: string[]): UpdateExperienceDto {
    const { category: _category, ...base } = dto;
    return {
      ...base,
      mediaKeys,
    };
  }

  private currentModalLoadToken: symbol | null = null;
}
