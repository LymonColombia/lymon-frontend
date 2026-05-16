import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideIcons } from '@ng-icons/core';
import { bootstrapStars } from '@ng-icons/bootstrap-icons';

import { CreateExperienceDto, Experience, UpdateExperienceDto } from '@/domain/entities/experience.model';
import { CreateExperienceUseCase } from '@/domain/use-cases/experience/create-experience.use-case';
import {
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { SelectOption } from '@/presentation/shared/components/select/select.component';
import { ExperienceFormComponent } from '../../components/experience-form/experience-form.component';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { UpdateExperienceUseCase } from '@/domain/use-cases/experience/update-experience.use-case';
import { GetExperienceByIdUseCase } from '@/domain/use-cases/experience/get-experience-by-id.use-case';

const EXPERIENCE_CATEGORIES = [
  'TRANSPORTATION',
  'Bienestar',
  'Comida',
  'Tour',
  'Entretenimiento',
  'Aventura',
  'Al aire libre',
];

@Component({
  selector: 'app-tenant-experience-form-page',
  standalone: true,
  imports: [
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    ExperienceFormComponent,
  ],
  providers: [provideIcons({ bootstrapStars })],
  templateUrl: './tenant-experience-form-page.component.html',
  styleUrl: './tenant-experience-form-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperienceFormPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly createExperienceUseCase = inject(CreateExperienceUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getPropertyUnitsUseCase = inject(GetUnitsUseCase);
  private readonly updateExperienceUseCase = inject(UpdateExperienceUseCase);
  private readonly getExperienceByIdUseCase = inject(GetExperienceByIdUseCase);

  readonly isSaving = signal(false);
  readonly isLoading = signal(false);
  readonly unitsLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly editingExperienceId = signal<string | null>(null);
  readonly editingExperience = signal<Experience | null>(null);
  readonly propertyOptions = signal<SelectOption[]>([]);
  readonly unitOptions = signal<SelectOption[]>([]);

  readonly categoryOptions: SelectOption[] = EXPERIENCE_CATEGORIES.map((category) => ({
    value: category,
    label: category,
  }));

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
          console.log('Loaded properties:', options);
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
          console.log('Loaded units for property:', propertyId, options);
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar las unidades.');
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

  onSubmitExperience(dto: CreateExperienceDto): void {
    this.startSaving();

    const editingId = this.editingExperienceId();
    if (editingId) {
      const updateDto = this.toUpdateExperienceDto(dto);
      console.log('Updating experience with ID:', editingId, 'and data:', updateDto);
      this.updateExperienceUseCase.execute(editingId, updateDto).subscribe({
        next: () => this.handleSaveSuccess('Experiencia actualizada correctamente.'),
        error: (error) => this.handleSaveError('No se pudo actualizar la experiencia.', error.message ),
      });
      return;
    }

    console.log('Creating experience with data:', dto);
    this.createExperienceUseCase.execute(dto).subscribe({
      next: () => this.handleSaveSuccess('Experiencia creada correctamente.'),
      error: (error) => this.handleSaveError('No se pudo crear la experiencia.', error),
    });
  }

  onCancel(): void {
    this.router.navigate(['/tenant-experiences']);
  }

  private startSaving(): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private handleSaveSuccess(message: string): void {
    this.isSaving.set(false);
    this.successMessage.set(message);
    this.router.navigate(['/tenant-experiences']);
  }

  private handleSaveError(message: string, error: any): void {
    this.isSaving.set(false);
    this.errorMessage.set(message + ' ' + error.error.message);
    console.error('Error saving experience:', error);
  }

  private loadEditValueIfNeeded(): void {
    const experienceId = this.route.snapshot.paramMap.get('id');
    if (!experienceId) {
      return;
    }

    this.editingExperienceId.set(experienceId);
    this.isLoading.set(true);
    this.errorMessage.set(null);

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
      priceCop: dto.priceCop,
      durationHours: dto.durationHours,
      capacity: dto.capacity,
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
