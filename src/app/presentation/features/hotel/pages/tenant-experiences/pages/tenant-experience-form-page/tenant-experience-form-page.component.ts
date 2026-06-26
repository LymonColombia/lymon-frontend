import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideIcons } from '@ng-icons/core';
import { bootstrapStar } from '@ng-icons/bootstrap-icons';
import { of, switchMap, map } from 'rxjs';

import { CreateExperienceDto, Experience, UpdateExperienceDto } from '@/domain/entities/experience.model';
import { CreateExperienceUseCase } from '@/domain/use-cases/experience/create-experience.use-case';
import { CreateImageStorageUseCase } from '@/domain/use-cases/image-storage/image-storage.use-case';
import {
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { SelectOption } from '@/presentation/shared/components/select/select.component';
import { ExperienceFormComponent } from '../../components/experience-form/experience-form.component';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { UpdateExperienceUseCase } from '@/domain/use-cases/experience/update-experience.use-case';
import { GetExperienceByIdUseCase } from '@/domain/use-cases/experience/get-experience-by-id.use-case';
import { ExperienceFormSubmitPayload } from '../../models/experience-form.model';

@Component({
  selector: 'app-tenant-experience-form-page',
  standalone: true,
  imports: [
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    ExperienceFormComponent,
    ModalComponent,
  ],
  providers: [provideIcons({ bootstrapStar })],
  templateUrl: './tenant-experience-form-page.component.html',
  styleUrl: './tenant-experience-form-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperienceFormPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly createExperienceUseCase = inject(CreateExperienceUseCase);
  private readonly createImageStorageUseCase = inject(CreateImageStorageUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getPropertyUnitsUseCase = inject(GetUnitsUseCase);
  private readonly updateExperienceUseCase = inject(UpdateExperienceUseCase);
  private readonly getExperienceByIdUseCase = inject(GetExperienceByIdUseCase);

  readonly isSaving = signal(false);
  readonly isLoading = signal(false);
  readonly unitsLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly saveErrorModalOpen = signal(false);
  readonly saveErrorTitle = signal('No se pudo guardar la experiencia');
  readonly saveErrorMessage = signal('');
  readonly editingExperienceId = signal<string | null>(null);
  readonly editingExperience = signal<Experience | null>(null);
  readonly propertyOptions = signal<SelectOption[]>([]);
  readonly unitOptions = signal<SelectOption[]>([]);


  readonly isEditing = computed(() => Boolean(this.editingExperienceId()));
  readonly pageTitle = computed(() => (this.isEditing() ? 'Editar Experiencia' : 'Nueva Experiencia'));

  ngOnInit(): void {
    this.loadProperties();
    this.loadEditValueIfNeeded();
  }

  private loadProperties(): void {
    this.getPropertiesUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (properties) => {
        const options = this.transformToSelectOptions(properties);
        this.propertyOptions.set(options);
      },
        error: () => {
          this.errorMessage.set('No se pudieron cargar las propiedades.');
        }
      });
  }

  onPropertyChanged(propertyId: string): void {
    this.searchPropertyUnits(propertyId);
  }

  private searchPropertyUnits(propertyId: string): void {
    if (!propertyId) {
      this.unitOptions.set([]);
      return;
    }

    this.unitsLoading.set(true);
    this.getPropertyUnitsUseCase
      .execute(propertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (units) => {
          const options = this.transformToSelectOptions(units);
          this.unitOptions.set(options);
          this.unitsLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar las habitaciones.');
          this.unitsLoading.set(false);
        }
      });
  }

  private transformToSelectOptions(items: { id: string; name: string }[]): SelectOption[] {
    return items.map(item => ({
      value: item.id,
      label: item.name
    }));
  }

  onSubmitExperience(payload: ExperienceFormSubmitPayload): void {
    this.startSaving();

    const persistedExperience$ = payload.coverImageFile
      ? this.createImageStorageUseCase.execute({ file: payload.coverImageFile, category: 'experiences' }).pipe(
          map(({ fileUrl }) => ({
            ...payload.experience,
            coverImageUrl: fileUrl,
          })),
        )
      : of(payload.experience);

    persistedExperience$
      .pipe(
        switchMap((experienceDto) => {
          const editingId = this.editingExperienceId();
          if (editingId) {
            return this.updateExperienceUseCase.execute(editingId, this.toUpdateExperienceDto(experienceDto));
          }

          return this.createExperienceUseCase.execute(experienceDto);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.handleSaveSuccess('Experiencia guardada correctamente.'),
        error: (error) => this.handleSaveError('No se pudo guardar la experiencia.', error),
      });
  }

  onCancel(): void {
    this.router.navigate(['/tenant-experiences']);
  }

  private startSaving(): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.saveErrorModalOpen.set(false);
  }

  private handleSaveSuccess(message: string): void {
    this.isSaving.set(false);
    this.successMessage.set(message);
    this.saveErrorModalOpen.set(false);
    this.router.navigate(['/tenant-experiences']);
  }

  private handleSaveError(message: string, error: any): void {
    this.isSaving.set(false);
    this.saveErrorTitle.set('No se pudo guardar la experiencia');
    this.saveErrorMessage.set(this.translateSaveError(error) || message);
    this.saveErrorModalOpen.set(true);
  }

  closeSaveErrorModal(): void {
    this.saveErrorModalOpen.set(false);
  }

  private translateSaveError(error: any): string {
    const statusCode = Number(error?.error?.statusCode ?? error?.status);
    const rawMessage = this.normalizeErrorMessage(error?.error?.message ?? error?.message).toLowerCase();

    if (statusCode === 409 || rawMessage.includes('an experience with this name already exists for this property')) {
      return 'Ya existe una experiencia con este nombre para esta propiedad.';
    }

    if (
      statusCode === 400 &&
      rawMessage.includes('experience start must be at least 24 hours in the future')
    ) {
      return 'La experiencia debe iniciar al menos 24 horas en el futuro.';
    }

    if (statusCode === 400 && rawMessage.includes('availability endat must be after startat')) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio.';
    }

    const fallbackMessage = this.normalizeErrorMessage(error?.error?.message ?? error?.message);
    return fallbackMessage || 'Ocurrió un error al guardar la experiencia. Inténtalo de nuevo.';
  }

  private normalizeErrorMessage(message: unknown): string {
    if (Array.isArray(message)) {
      return message.filter(Boolean).join(' ');
    }

    if (typeof message === 'string') {
      return message.trim();
    }

    return '';
  }

  private loadEditValueIfNeeded(): void {
    const experienceId = this.route.snapshot.paramMap.get('id');
    if (!experienceId) {
      return;
    }

    this.editingExperienceId.set(experienceId);
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.saveErrorModalOpen.set(false);

    this.getExperienceByIdUseCase
      .execute(experienceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (experience) => {
          if (!experience) {
            this.errorMessage.set('No se encontro la experiencia solicitada.');
            this.isLoading.set(false);
            return;
          }

          this.editingExperience.set(experience);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('No se pudo cargar la experiencia para editar.');
          this.isLoading.set(false);
        },
      });
  }

  private toUpdateExperienceDto(dto: CreateExperienceDto): UpdateExperienceDto {
    return {
      name: dto.name,
      description: dto.description,
      propertyId: dto.propertyId,
      unitIds: dto.unitIds,
      priceCop: dto.priceCop,
      durationHours: dto.durationHours,
      capacity: dto.capacity,
      minimumParticipants: dto.minimumParticipants,
      coverImageUrl: dto.coverImageUrl,
      location: dto.location,
      availabilityType: dto.availabilityType,
      startAt: dto.startAt,
      endAt: dto.endAt,
      recurrence: dto.recurrence,
      blackoutRanges: dto.blackoutRanges,
      allowStandalonePurchase: dto.allowStandalonePurchase,
      allowReservationPurchase: dto.allowReservationPurchase,
    };
  }
}
