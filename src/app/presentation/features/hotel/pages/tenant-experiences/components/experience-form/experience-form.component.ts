import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CreateExperienceDto, Experience, ExperienceAvailabilityType, ExperienceScope } from '@/domain/entities/experience.model';
import { BlackoutRangeFormControls, ExperienceFormControls } from '../../models/experience-form.model';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ExperienceLocationSectionComponent } from '../experience-location-section/experience-location-section.component';
import { ExperienceAvailabilitySectionComponent } from '../experience-availability-section/experience-availability-section.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { CreateImageStorageUseCase } from '@/domain/use-cases/image-storage/image-storage.use-case';
import { ImageStorage } from '@/domain/entities/storage-img';

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    SelectComponent,
    ExperienceLocationSectionComponent,
    ExperienceAvailabilitySectionComponent,
  ],
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly createImageStorageUseCase = inject(CreateImageStorageUseCase);
  private patchedExperienceId: string | null = null;
  private readonly allowedContentTypes = new Set<string>([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ]);

  
  readonly initialExperience = input<Experience | null>(null);
  readonly isSaving = input(false);
  readonly categoryOptions = input.required<SelectOption[]>();
  readonly submitted = output<CreateExperienceDto>();
  readonly cancelled = output<void>();
  readonly propertyChanged = output<string>();

  readonly propertyOptions = input<SelectOption[]>([]);
  readonly unitOptions = input<SelectOption[]>([]);
  readonly unitsLoading = input(false);
  readonly isEditingMode = computed(() => Boolean(this.initialExperience()));

  readonly scopeOptions: SelectOption[] = [
    { value: 'TENANT', label: 'Tenant' },
    { value: 'PROPERTY', label: 'Property' },
  ];

  readonly availabilityTypeOptions: SelectOption[] = [
    { value: 'DATE_RANGE', label: 'Rango de Fechas' },
    { value: 'RECURRING', label: 'Recurrencia' },
    { value: 'ONE_TIME', label: 'Una sola vez' },
  ];


  readonly form = this.fb.group<ExperienceFormControls>({
    scope: this.fb.control<ExperienceScope>('TENANT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    propertyId: this.fb.control('', { nonNullable: true }),
    unitIds: this.fb.control<string[]>([], { nonNullable: true }),
    name: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    description: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    category: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    priceCop: this.fb.control<number|undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)] }),
    durationHours: this.fb.control<number|undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    capacity: this.fb.control<number|undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    coverImageUrl: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    availabilityType: this.fb.control<ExperienceAvailabilityType>('DATE_RANGE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startAt: this.fb.control('',{ nonNullable: true }),
    endAt: this.fb.control('',{ nonNullable: true }),
    blackoutRanges: this.fb.array<FormGroup<BlackoutRangeFormControls>>([]),
    recurrence: this.fb.group({
      daysOfWeek: this.fb.control<number[]>([], { nonNullable: true }),
      startTime: this.fb.control('', { nonNullable: true }),
      endTime: this.fb.control('', { nonNullable: true }),
    }),
    location: this.fb.group({
      label: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      address: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      lat: this.fb.control<number | null>(null, [Validators.required]),
      lng: this.fb.control<number | null>(null, [Validators.required]),
    }),
    allowStandalonePurchase: this.fb.control(true, { nonNullable: true }),
    allowReservationPurchase: this.fb.control(false, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const experience = this.initialExperience();
      if (!experience) {
        return;
      }

      const nextExperienceId = experience.id ?? null;
      if (nextExperienceId && this.patchedExperienceId === nextExperienceId) {
        return;
      }

      this.patchFormFromExperience(experience);
      this.patchedExperienceId = nextExperienceId;
    });
  }

  get isPropertyScope(): boolean {
    return this.form.controls.scope.value === 'PROPERTY';
  }

  get isTenantScope(): boolean {
    return this.form.controls.scope.value === 'TENANT';
  }

  get isDateRange(): boolean {
    return this.form.controls.availabilityType.value === 'DATE_RANGE';
  }

  get isRecurring(): boolean {
    return this.form.controls.availabilityType.value === 'RECURRING';
  }

  get isOneTime(): boolean {
    return this.form.controls.availabilityType.value === 'ONE_TIME';
  }

  get scopeLabel(): string {
    const value = this.form.controls.scope.value;
    return this.scopeOptions.find((option) => option.value === value)?.label ?? '';
  }

  get categoryLabel(): string {
    const value = this.form.controls.category.value;
    return this.categoryOptions().find((option) => option.value === value)?.label ?? '';
  }


  onPropertyChanged(value: string | number): void {
    const propertyId = String(value);
    if (!propertyId) {
      this.form.controls.unitIds.setValue([]);
      return;
    }

    this.propertyChanged.emit(propertyId);
    this.form.controls.unitIds.setValue([]);
  }

  onUnitChecklistToggle(unitId: string, checked: boolean): void {
    const current = this.form.controls.unitIds.value;
    const next = checked ? [...new Set([...current, unitId])] : current.filter((value) => value !== unitId);
    this.form.controls.unitIds.setValue(next);
    this.form.controls.unitIds.markAsTouched();
    this.form.controls.unitIds.updateValueAndValidity();
  }

  isUnitSelected(unitId: string): boolean {
    return this.form.controls.unitIds.value.includes(unitId);
  }

  get blackoutRanges(): FormArray<FormGroup<BlackoutRangeFormControls>> {
    return this.form.controls.blackoutRanges;
  }

  onAddBlackoutRange(): void {
    this.blackoutRanges.push(this.createBlackoutRangeGroup());
    this.blackoutRanges.markAsDirty();
    this.blackoutRanges.updateValueAndValidity();
  }

  onRemoveBlackoutRange(index: number): void {
    if (index < 0 || index >= this.blackoutRanges.length) {
      return;
    }

    this.blackoutRanges.removeAt(index);
    this.blackoutRanges.markAsDirty();
    this.blackoutRanges.updateValueAndValidity();
  }

  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.allowedContentTypes.has(file.type)) {
      this.form.controls.coverImageUrl.setErrors({ invalidContentType: true });
      this.form.controls.coverImageUrl.markAsTouched();
      return;
    }

    const dto: ImageStorage = {
      file,
    };

    this.createImageStorageUseCase.execute(dto).subscribe({
      next: ({ fileUrl }) => {
        this.form.controls.coverImageUrl.setErrors(null);
        this.form.controls.coverImageUrl.setValue(fileUrl);
        this.form.controls.coverImageUrl.markAsDirty();
        this.form.controls.coverImageUrl.updateValueAndValidity();
      },
      error: () => {
        this.form.controls.coverImageUrl.setErrors({ uploadFailed: true });
        this.form.controls.coverImageUrl.markAsTouched();
      }
    });

  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.buildPayload());
  }

  private patchFormFromExperience(experience: Experience): void {
    const blackoutRanges = experience.blackoutRanges ?? [];
    const blackoutControls = blackoutRanges.map((range) =>
      this.createBlackoutRangeGroup(
        this.toLocalDateTime(range.startAt),
        this.toLocalDateTime(range.endAt),
      ),
    );

    this.form.setControl('blackoutRanges', this.fb.array(blackoutControls));
    this.form.patchValue({
      scope: experience.scope,
      propertyId: experience.propertyId ?? '',
      unitIds: experience.unitIds ?? [],
      name: experience.name,
      description: experience.description,
      category: experience.category,
      priceCop: experience.priceCop,
      durationHours: experience.durationHours,
      capacity: experience.capacity,
      coverImageUrl: experience.coverImageUrl,
      availabilityType: experience.availabilityType,
      startAt: this.toLocalDateTime(experience.startAt),
      endAt: this.toLocalDateTime(experience.endAt),
      recurrence: {
        daysOfWeek: experience.recurrence?.daysOfWeek ?? [],
        startTime: experience.recurrence?.startTime ?? '',
        endTime: experience.recurrence?.endTime ?? '',
      },
      location: {
        label: experience.location.label,
        address: experience.location.address,
        lat: experience.location.lat,
        lng: experience.location.lng,
      },
      allowStandalonePurchase: experience.allowStandalonePurchase ?? true,
      allowReservationPurchase: experience.allowReservationPurchase ?? false,
    });

    if (experience.scope === 'PROPERTY' && experience.propertyId) {
      this.propertyChanged.emit(experience.propertyId);
    }
  }



  private buildPayload(): CreateExperienceDto {
    const raw = this.form.getRawValue();
    const payload: Partial<CreateExperienceDto> = {
      scope: raw.scope,
      name: raw.name,
      description: raw.description,
      category: raw.category,
      priceCop: raw.priceCop,
      durationHours: raw.durationHours,
      capacity: raw.capacity,
      coverImageUrl: raw.coverImageUrl,
      availabilityType: raw.availabilityType,
      location: {
        label: raw.location.label,
        address: raw.location.address,
        lat: raw.location.lat ?? 0,
        lng: raw.location.lng ?? 0,
      },
      allowStandalonePurchase: raw.allowStandalonePurchase,
      allowReservationPurchase: raw.allowReservationPurchase,
    };

    if (raw.scope === 'PROPERTY') {
      payload.propertyId = raw.propertyId || undefined;
      payload.unitIds = raw.unitIds?.length ? raw.unitIds : undefined;
    }

    if (raw.availabilityType === 'DATE_RANGE') {
      payload.startAt = this.toIsoDateTime(raw.startAt);
      payload.endAt = this.toIsoDateTime(raw.endAt);
      
      payload.blackoutRanges = raw.blackoutRanges.map((range) => ({
        startAt: this.toIsoDateTime(range.startAt ?? ''),
        endAt: this.toIsoDateTime(range.endAt ?? ''),
      }));
      
    }

    if (raw.availabilityType === 'RECURRING') {
      payload.recurrence = {
        daysOfWeek: raw.recurrence.daysOfWeek,
        startTime: raw.recurrence.startTime,
        endTime: raw.recurrence.endTime,
      };
    }

    if (raw.availabilityType === 'ONE_TIME') {
      payload.startAt = this.toIsoDateTime(raw.startAt);
      payload.endAt = this.toIsoDateTime(raw.endAt);
    }

    return payload as CreateExperienceDto;
  }

  private toIsoDateTime(localValue: string): string {
    const date = new Date(localValue);
    if (Number.isNaN(date.getTime())) {
      return localValue;
    }

    return date.toISOString();
  }

  private createBlackoutRangeGroup(
    startAt: string | null = null,
    endAt: string | null = null,
  ): FormGroup<BlackoutRangeFormControls> {
    return this.fb.group<BlackoutRangeFormControls>({
      startAt: this.fb.control<string | null>(startAt),
      endAt: this.fb.control<string | null>(endAt),
    });
  }

  private toLocalDateTime(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;  
  }
}
