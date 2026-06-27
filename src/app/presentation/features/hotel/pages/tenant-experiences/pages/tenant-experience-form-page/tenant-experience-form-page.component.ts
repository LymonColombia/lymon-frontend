import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideIcons } from '@ng-icons/core';
import { of, switchMap, map, forkJoin } from 'rxjs';
import { bootstrapStar } from '@ng-icons/bootstrap-icons';

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
import { EXPERIENCE_MESSAGES, getExperienceSaveErrorMessage } from '@/domain/constants/experience-messages.constants';

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
    }))
    
  }

  onSubmitExperience(payload: ExperienceFormSubmitPayload): void {
    this.startSaving();

    // Upload media first, keeping the returned keys (not URLs). The cover is
    // re-uploaded only when the user picked a new file; otherwise its existing key is reused.
    const coverKey$ = payload.coverImageFile
      ? this.uploadExperienceMedia(payload.coverImageFile)
      : of<string | undefined>(payload.existingCoverKey ?? undefined);

    const newMediaKeys$ = payload.newMediaFiles.length
      ? forkJoin(payload.newMediaFiles.map((file) => this.uploadExperienceMedia(file)))
      : of<string[]>([]);

    forkJoin({ coverKey: coverKey$, newMediaKeys: newMediaKeys$ })
      .pipe(
        switchMap(({ coverKey, newMediaKeys }) => {
          // Cover is mediaKeys[0]; then the kept gallery keys, then the freshly uploaded ones.
          const mediaKeys = [
            ...(coverKey ? [coverKey] : []),
            ...payload.keptMediaItems.map((item) => item.key),
            ...newMediaKeys,
          ];
          const editingId = this.editingExperienceId();

          if (editingId) {
            return this.updateExperienceUseCase.execute(
              editingId,
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
        next: () => this.handleSaveSuccess('Experiencia guardada correctamente.'),
        error: (error) => this.handleSaveError('No se pudo guardar la experiencia.', error),
      });
  }

  private uploadExperienceMedia(file: File) {
    return this.createImageStorageUseCase
      .execute({ file, category: 'experiences' })
      .pipe(map(({ key }) => key));
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
    this.saveErrorMessage.set(getExperienceSaveErrorMessage(error) || message);
    this.saveErrorModalOpen.set(true);
  }

  closeSaveErrorModal(): void {
    this.saveErrorModalOpen.set(false);
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
            this.errorMessage.set(EXPERIENCE_MESSAGES.error.missingExperience);
            this.isLoading.set(false);
            return;
          }

          this.editingExperience.set(experience);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set(EXPERIENCE_MESSAGES.error.loadEditExperience);
          this.isLoading.set(false);
        },
      });
  }

  private toUpdateExperienceDto(dto: CreateExperienceDto, mediaKeys: string[]): UpdateExperienceDto {
    return {
      name: dto.name,
      description: dto.description,
      unitIds: dto.unitIds,
      priceCop: dto.priceCop,
      durationHours: dto.durationHours,
      capacity: dto.capacity,
      minimumParticipants: dto.minimumParticipants,
      location: dto.location,
      availabilityType: dto.availabilityType,
      startAt: dto.startAt,
      endAt: dto.endAt,
      recurrence: dto.recurrence,
      blackoutRanges: dto.blackoutRanges,
      allowStandalonePurchase: dto.allowStandalonePurchase,
      allowReservationPurchase: dto.allowReservationPurchase,
      mediaKeys,
    };
  }
}

