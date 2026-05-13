import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { startWith } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import { bootstrapStars } from '@ng-icons/bootstrap-icons';
import {
  CreateExperienceDto,
  Experience,
  ExperienceScope,
  PropertyExperience,
  TenantExperience,
} from '@/domain/entities/experience.model';
import { CreateExperienceUseCase } from '@/domain/use-cases/experience/create-experience.use-case';
import {
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { SelectOption } from '@/presentation/shared/components/select/select.component';
import { ExperienceFormComponent } from '../../components/experience-form/experience-form.component';
import { BlackoutRangeFormControls, ExperienceFormControls } from '../../models/experience-form.model';
import { TenantExperienceLocalStoreService } from '../../tenant-experience-local-store.service';

const EXPERIENCE_CATEGORIES = [
  'Transporte',
  'Bienestar',
  'Comida',
  'Tour',
  'Entretenimiento',
  'Aventura',
  'Al aire libre'
];

@Component({
  selector: 'app-tenant-experience-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    ButtonComponent,
    ExperienceFormComponent,
  ],
  providers: [provideIcons({ bootstrapStars })],
  templateUrl: './tenant-experience-form-page.component.html',
  styleUrl: './tenant-experience-form-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExperienceFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localStore = inject(TenantExperienceLocalStoreService);
  private readonly createExperienceUseCase = inject(CreateExperienceUseCase);

  readonly isSaving = signal(false);
  readonly isLoading = signal(false);
  readonly unitsLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly editingExperienceId = signal<string | null>(null);
  readonly unitOptions = signal<SelectOption[]>([]);
  readonly propertyOptions = signal<SelectOption[]>([]);

  readonly scopeOptions: SelectOption[] = [
    { value: 'TENANT', label: 'Tenant' },
    { value: 'PROPERTY', label: 'Property' },
  ];

  readonly categoryOptions: SelectOption[] = EXPERIENCE_CATEGORIES.map((category) => ({
    value: category,
    label: category,
  }));

  readonly availabilityTypeOptions: SelectOption[] = [
    { value: 'DATE_RANGE', label: 'Rango de Fechas' },
    { value: 'RECURRING', label: 'Recurrencia' },
  ];

  readonly form = this.fb.group<ExperienceFormControls>({
    scope: this.fb.control<'PROPERTY' | 'TENANT'>('TENANT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    propertyId: this.fb.control('', { nonNullable: true }),
    unitIds: this.fb.control<string[]>([], { nonNullable: true }),
    name: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    description: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    category: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    priceCop: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    durationHours: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    capacity: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    coverImageUrl: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    availabilityType: this.fb.control<'DATE_RANGE' | 'RECURRING'>('RECURRING', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startAt: this.fb.control('', { nonNullable: true }),
    endAt: this.fb.control('', { nonNullable: true }),
    blackoutRanges: this.fb.array<FormGroup<BlackoutRangeFormControls>>([]),
    recurrence: this.fb.group({
      daysOfWeek: this.fb.control<number[]>([], { nonNullable: true }),
      startTime: this.fb.control('', { nonNullable: true }),
      endTime: this.fb.control('', { nonNullable: true }),
    }),
    location: this.fb.group({
      label: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      address: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      lat: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(-90),
        Validators.max(90),
      ]),
      lng: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(-180),
        Validators.max(180),
      ]),
    }),
  });

  readonly isEditing = computed(() => Boolean(this.editingExperienceId()));

  readonly pageTitle = computed(() =>
    this.isEditing() ? 'Editar Experiencia' : 'Nueva Experiencia',
  );

  constructor() {
    this.setupDynamicRules();
    this.loadProperties();
    this.loadEditValueIfNeeded();
  }

  onPropertyChanged(propertyId: string): void {
    this.loadUnits(propertyId);
  }

  onAddBlackoutRange(): void {
    this.form.controls.blackoutRanges.push(this.createBlackoutRangeGroup());
  }

  onRemoveBlackoutRange(index: number): void {
    this.form.controls.blackoutRanges.removeAt(index);
  }

  onCancel(): void {
    this.router.navigate(['/tenant-experiences']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.toDtoFromForm(this.form.getRawValue());
    const editingId = this.editingExperienceId();
    this.startSaving();

    if (editingId) {
      this.submitEdit(editingId, dto);
      return;
    }

    this.submitCreate(dto);
  }

  private submitEdit(experienceId: string, dto: CreateExperienceDto): void {
    this.localStore.update(experienceId, dto).subscribe({
      next: () => this.handleSaveSuccess('Experiencia actualizada correctamente.'),
      error: () => this.handleSaveError('No se pudo actualizar la experiencia.'),
    });
  }

  private submitCreate(dto: CreateExperienceDto): void {
    console.log('DTO to submit:', dto);
    /**this.createExperienceUseCase.execute(dto).subscribe({
      next: () => this.handleSaveSuccess('Experiencia creada correctamente.'),
      error: () => this.handleSaveError('No se pudo crear la experiencia.'),
    });**/
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

  private handleSaveError(message: string): void {
    this.isSaving.set(false);
    this.errorMessage.set(message);
  }

  private setupDynamicRules(): void {
    this.form.controls.scope.valueChanges
      .pipe(startWith(this.form.controls.scope.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((scope) => {
        this.applyScopeRules(scope);
      });

    this.form.controls.availabilityType.valueChanges
      .pipe(
        startWith(this.form.controls.availabilityType.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((availabilityType) => {
        this.applyAvailabilityRules(availabilityType);
      });
  }

  private applyScopeRules(scope: ExperienceScope): void {
    if (scope === 'PROPERTY') {
      this.form.controls.propertyId.enable({ emitEvent: false });
      this.form.controls.unitIds.enable({ emitEvent: false });
      this.form.controls.propertyId.setValidators([Validators.required]);
      this.form.controls.unitIds.setValidators([this.minArrayLengthValidator(1)]);

      this.form.controls.availabilityType.setValue('DATE_RANGE', { emitEvent: false });
      this.form.controls.availabilityType.disable({ emitEvent: false });

      this.form.controls.recurrence.disable({ emitEvent: false });
      this.form.controls.recurrence.reset(
        { daysOfWeek: [], startTime: '', endTime: '' },
        { emitEvent: false },
      );
    } else {
      this.form.controls.propertyId.setValue('', { emitEvent: false });
      this.form.controls.unitIds.setValue([], { emitEvent: false });
      this.form.controls.propertyId.clearValidators();
      this.form.controls.unitIds.clearValidators();
      this.form.controls.propertyId.disable({ emitEvent: false });
      this.form.controls.unitIds.disable({ emitEvent: false });

      this.form.controls.availabilityType.setValue('RECURRING', { emitEvent: false });
      this.form.controls.availabilityType.disable({ emitEvent: false });

      this.form.controls.recurrence.enable({ emitEvent: false });
      this.form.controls.blackoutRanges.clear();
    }

    this.form.controls.propertyId.updateValueAndValidity({ emitEvent: false });
    this.form.controls.unitIds.updateValueAndValidity({ emitEvent: false });
    this.applyAvailabilityRules(this.form.controls.availabilityType.value);
  }

  private applyAvailabilityRules(availabilityType: 'DATE_RANGE' | 'RECURRING'): void {
    if (availabilityType === 'DATE_RANGE') {
      this.form.controls.startAt.enable({ emitEvent: false });
      this.form.controls.endAt.enable({ emitEvent: false });
      this.form.controls.startAt.setValidators([Validators.required]);
      this.form.controls.endAt.setValidators([Validators.required]);

      this.form.controls.recurrence.controls.daysOfWeek.clearValidators();
      this.form.controls.recurrence.controls.startTime.clearValidators();
      this.form.controls.recurrence.controls.endTime.clearValidators();
    } else {
      this.form.controls.startAt.setValue('', { emitEvent: false });
      this.form.controls.endAt.setValue('', { emitEvent: false });
      this.form.controls.startAt.clearValidators();
      this.form.controls.endAt.clearValidators();
      this.form.controls.startAt.disable({ emitEvent: false });
      this.form.controls.endAt.disable({ emitEvent: false });
      this.form.controls.blackoutRanges.clear();

      this.form.controls.recurrence.controls.daysOfWeek.setValidators([
        this.minArrayLengthValidator(1),
      ]);
      this.form.controls.recurrence.controls.startTime.setValidators([Validators.required]);
      this.form.controls.recurrence.controls.endTime.setValidators([Validators.required]);
    }

    this.form.controls.startAt.updateValueAndValidity({ emitEvent: false });
    this.form.controls.endAt.updateValueAndValidity({ emitEvent: false });
    this.form.controls.recurrence.controls.daysOfWeek.updateValueAndValidity({ emitEvent: false });
    this.form.controls.recurrence.controls.startTime.updateValueAndValidity({ emitEvent: false });
    this.form.controls.recurrence.controls.endTime.updateValueAndValidity({ emitEvent: false });
  }

  private loadProperties(): void {
    this.propertyOptions.set(this.localStore.getPropertyOptions());
  }

  private loadUnits(propertyId: string): void {
    if (!propertyId) {
      this.unitOptions.set([]);
      this.form.controls.unitIds.setValue([]);
      return;
    }

    this.unitsLoading.set(true);
    this.unitOptions.set(this.localStore.getUnitOptions(propertyId));
    this.unitsLoading.set(false);
  }

  private loadEditValueIfNeeded(): void {
    const experienceId = this.route.snapshot.paramMap.get('id');
    if (!experienceId) {
      return;
    }

    this.editingExperienceId.set(experienceId);
    this.isLoading.set(true);

    this.localStore
      .getById(experienceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (experience) => {
          if (!experience) {
            this.errorMessage.set('No se encontro la experiencia.');
            this.isLoading.set(false);
            return;
          }

          this.patchFormFromExperience(experience);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('No se pudo cargar la experiencia.');
          this.isLoading.set(false);
        },
      });
  }

  private patchFormFromExperience(experience: Experience): void {
    this.form.patchValue({
      scope: experience.scope,
      name: experience.name,
      description: experience.description,
      category: experience.category,
      priceCop: experience.priceCop,
      durationHours: experience.durationHours,
      capacity: experience.capacity,
      coverImageUrl: experience.coverImageUrl,
      availabilityType: experience.availabilityType,
      location: {
        label: experience.location.label,
        address: experience.location.address,
        lat: experience.location.lat,
        lng: experience.location.lng,
      },
    });

    if (experience.scope === 'PROPERTY') {
      this.form.patchValue({
        propertyId: experience.propertyId,
        unitIds: experience.unitIds,
        startAt: this.toDateTimeLocal(experience.startAt),
        endAt: this.toDateTimeLocal(experience.endAt),
      });

      this.form.controls.blackoutRanges.clear();
      for (const blackout of experience.blackoutRanges) {
        this.form.controls.blackoutRanges.push(
          this.createBlackoutRangeGroup(
            this.toDateTimeLocal(blackout.startAt),
            this.toDateTimeLocal(blackout.endAt),
          ),
        );
      }

      this.loadUnits(experience.propertyId);
    } else {
      this.form.patchValue({
        recurrence: {
          daysOfWeek: experience.recurrence.daysOfWeek,
          startTime: experience.recurrence.startTime,
          endTime: experience.recurrence.endTime,
        },
      });
    }
  }

  private createBlackoutRangeGroup(startAt = '', endAt = ''): FormGroup<BlackoutRangeFormControls> {
    return this.fb.group({
      startAt: this.fb.control(startAt, { nonNullable: true, validators: [Validators.required] }),
      endAt: this.fb.control(endAt, { nonNullable: true, validators: [Validators.required] }),
    });
  }

  private minArrayLengthValidator(minLength: number): ValidatorFn {
    return (control) => {
      const value = control.value as unknown;
      if (!Array.isArray(value) || value.length < minLength) {
        return { minArrayLength: true };
      }

      return null;
    };
  }

  private toDateTimeLocal(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  private toIsoDateTime(localValue: string): string {
    const date = new Date(localValue);
    if (Number.isNaN(date.getTime())) {
      return localValue;
    }

    return date.toISOString();
  }

  private toDtoFromForm(
    raw: ReturnType<FormGroup<ExperienceFormControls>['getRawValue']>): CreateExperienceDto {
    if (raw.scope === 'PROPERTY') {
      const dto: PropertyExperience = {
        scope: 'PROPERTY',
        propertyId: raw.propertyId,
        unitIds: raw.unitIds,
        name: raw.name,
        description: raw.description,
        category: raw.category,
        priceCop: raw.priceCop ?? 0,
        durationHours: raw.durationHours ?? 0,
        capacity: raw.capacity ?? 0,
        coverImageUrl: raw.coverImageUrl,
        location: {
          label: raw.location.label,
          address: raw.location.address,
          lat: raw.location.lat ?? 0,
          lng: raw.location.lng ?? 0,
        },
        availabilityType: 'DATE_RANGE',
        startAt: this.toIsoDateTime(raw.startAt),
        endAt: this.toIsoDateTime(raw.endAt),
        blackoutRanges: raw.blackoutRanges.map((range) => ({
          startAt: this.toIsoDateTime(range.startAt),
          endAt: this.toIsoDateTime(range.endAt),
        })),
      };
      return dto;
    }

    const dto: TenantExperience = {
      scope: 'TENANT',
      name: raw.name,
      description: raw.description,
      category: raw.category,
      priceCop: raw.priceCop ?? 0,
      durationHours: raw.durationHours ?? 0,
      capacity: raw.capacity ?? 0,
      coverImageUrl: raw.coverImageUrl,
      location: {
        label: raw.location.label,
        address: raw.location.address,
        lat: raw.location.lat ?? 0,
        lng: raw.location.lng ?? 0,
      },
      availabilityType: 'RECURRING',
      recurrence: {
        daysOfWeek: raw.recurrence.daysOfWeek,
        startTime: raw.recurrence.startTime,
        endTime: raw.recurrence.endTime,
      },
    };
    return dto;
  }

}
