import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CreateExperienceDto, Experience, ExperienceAvailabilityType, ExperienceScope } from '@/domain/entities/experience.model';
import { BlackoutRangeFormControls, ExperienceFormControls } from '../../models/experience-form.model';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ExperienceLocationSectionComponent } from '../experience-location-section/experience-location-section.component';
import { ExperienceAvailabilitySectionComponent } from '../experience-availability-section/experience-availability-section.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapFile, bootstrapStars } from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';

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
    NgIcon,
  ],
  providers: [provideIcons({ bootstrapStars, bootstrapFile })],
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent {
  private readonly fb = inject(FormBuilder);
  
  readonly initialExperience = input<Experience | null>(null);
  readonly isSaving = input(false);
  readonly categoryOptions = input.required<SelectOption[]>();
  readonly submitted = output<CreateExperienceDto>();
  readonly cancelled = output<void>();
  readonly propertyChanged = output<string>();

  readonly propertyOptions = input<SelectOption[]>([]);
  readonly unitOptions = input<SelectOption[]>([]);
  readonly unitsLoading = input(false);
  readonly addBlackoutRange = output<void>();
  readonly removeBlackoutRange = output<number>();

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
    blackoutRanges: this.fb.array([this.fb.group({
      startAt: this.fb.control<string | null>(null, { nonNullable: true }),
      endAt: this.fb.control<string | null>(null, { nonNullable: true }),
    })]),
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
    this.addBlackoutRange.emit();
  }

  onRemoveBlackoutRange(index: number): void {
    this.removeBlackoutRange.emit(index);
  }

  onCoverImageSelected(): void {
    this.form.controls.coverImageUrl.setValue('https://picsum.photos/id/10/800/600');
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
}
