import {ChangeDetectionStrategy,Component,DestroyRef,computed,effect,inject,input,output,signal} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapTrash, bootstrapFloppy, bootstrapCloudUpload } from '@ng-icons/bootstrap-icons';
import {CreateExperienceDto,Experience,ExperienceAvailabilityType,ExperienceScope} from '@/domain/entities/experience.model';
import {DAY_OPTIONS,BlackoutRangeFormControls,ExperienceFormControls,ExperienceFormSubmitPayload} from '../../models/experience-form.model';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { HotelTooltipComponent } from '@/presentation/features/hotel/components/hotel-tooltip/hotel-tooltip';
import { MapPickerComponent, MapPickerLocation } from '@/presentation/features/hotel/components/map-picker/map-picker';
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [ReactiveFormsModule,InputComponent,ButtonComponent,SelectComponent,HotelTooltipComponent,NgIcon,MapPickerComponent],
  providers: [provideIcons({ bootstrapTrash, bootstrapFloppy, bootstrapCloudUpload })],
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialExperience = input<Experience | null>(null);
  readonly isSaving = input(false);
  readonly propertyOptions = input<SelectOption[]>([]);
  readonly unitOptions = input<SelectOption[]>([]);
  readonly unitsLoading = input(false);

  readonly submitted = output<ExperienceFormSubmitPayload>();
  readonly cancelled = output<void>();
  readonly propertyChanged = output<string>();

  // States
  readonly coverImagePreviewUrl = signal<string | null>(null);
  readonly selectedCoverImageFile = signal<File | null>(null);

  readonly isEditingMode = computed(() => Boolean(this.initialExperience()));
  get hasCoverImage(): boolean { return Boolean(this.coverImagePreviewUrl()); }


  readonly categoryOptions: SelectOption[] = [
    { value: 'TRANSPORTATION', label: 'Transporte' },
  ];

  readonly scopeOptions: SelectOption[] = [
    { value: 'TENANT', label: 'Global' },
    { value: 'PROPERTY', label: 'Propiedad' },
  ];

  readonly availabilityTypeOptions: SelectOption[] = [
    { value: 'DATE_RANGE', label: 'Rango de Fechas' },
    { value: 'RECURRING', label: 'Recurrencia' },
    { value: 'ONE_TIME', label: 'Una sola vez' },
  ];

  readonly dayOptions = DAY_OPTIONS;

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
    priceCop: this.fb.control<number | undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    durationHours: this.fb.control<number | undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    capacity: this.fb.control<number | undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    coverImageUrl: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    availabilityType: this.fb.control<ExperienceAvailabilityType>('DATE_RANGE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startAt: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    endAt: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    blackoutRanges: this.fb.array<FormGroup<BlackoutRangeFormControls>>([]),
    recurrence: this.fb.group({
      daysOfWeek: this.fb.control<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      startTime: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      endTime: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    }),
    location: this.fb.group({
      label: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      address: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      lat: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required] }),
      lng: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required] }),
    }),
  });

  get isPropertyScope(): boolean { return this.form.controls.scope.value === 'PROPERTY'; }
  get isDateRange(): boolean { return this.form.controls.availabilityType.value === 'DATE_RANGE'; }
  get isRecurring(): boolean { return this.form.controls.availabilityType.value === 'RECURRING'; }
  get isOneTime(): boolean { return this.form.controls.availabilityType.value === 'ONE_TIME'; }

  get blackoutRanges(): FormArray<FormGroup<BlackoutRangeFormControls>> {
    return this.form.controls.blackoutRanges;
  }

  
  constructor() {
    this.destroyRef.onDestroy(() => this.revokeCoverImageObjectUrl());
    this.syncAvailabilityValidators(this.form.controls.availabilityType.value);

    this.form.controls.availabilityType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => this.syncAvailabilityValidators(type));

    effect(() => {
      const experience = this.initialExperience();
      if (!experience) return;
      if (experience.id && experience.id === this.patchedExperienceId) return;
      this.patchFormFromExperience(experience);
      this.patchedExperienceId = experience.id ?? null;
    });
  }


  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit({ experience: this.buildPayload(), coverImageFile: this.selectedCoverImageFile() });
  }

  onCancel(): void {
    this.cancelled.emit();
  }


  onLocationChanged(location: MapPickerLocation | null): void {
    this.form.controls.location.patchValue(
      location
        ? { lat: location.lat, lng: location.lng }
        : ({ lat: 0, lng: 0 }),
    );
  }

 
  onPropertyChanged(value: string | number): void {
    const propertyId = String(value);
    this.form.controls.unitIds.setValue([]);
    if (propertyId) this.propertyChanged.emit(propertyId);
  }

  onUnitChecklistToggle(unitId: string, checked: boolean): void {
    const current = this.form.controls.unitIds.value;
    const next = checked
      ? [...new Set([...current, unitId])]
      : current.filter((id) => id !== unitId);
    this.form.controls.unitIds.setValue(next);
    this.form.controls.unitIds.markAsTouched();
    this.form.controls.unitIds.updateValueAndValidity();
  }

  isUnitSelected(unitId: string): boolean {
    return this.form.controls.unitIds.value.includes(unitId);
  }

  
  isDaySelected(day: number): boolean {
    return this.form.controls.recurrence.controls.daysOfWeek.value.includes(day);
  }

  toggleDay(day: number): void {
    const control = this.form.controls.recurrence.controls.daysOfWeek;
    const current = control.value;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    control.setValue(next);
    control.markAsTouched();
    control.updateValueAndValidity();
  }

 
  onAddBlackoutRange(): void {
    this.blackoutRanges.push(this.createBlackoutRangeGroup());
    this.blackoutRanges.markAsDirty();
    this.blackoutRanges.updateValueAndValidity();
  }

  onRemoveBlackoutRange(index: number): void {
    if (index < 0 || index >= this.blackoutRanges.length) return;
    this.blackoutRanges.removeAt(index);
    this.blackoutRanges.markAsDirty();
    this.blackoutRanges.updateValueAndValidity();
  }

 
  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      this.form.controls.coverImageUrl.setErrors({ invalidContentType: true });
      this.form.controls.coverImageUrl.markAsTouched();
      if (input) input.value = '';
      return;
    }

    this.setCoverImagePreview(file);
    if (input) input.value = '';
  }

  onRemoveCoverImage(input?: HTMLInputElement | null): void {
    this.clearCoverImageSelection();
    if (input) input.value = '';
  }

  //setup

  private patchedExperienceId: string | null = null;

  private patchFormFromExperience(experience: Experience): void {
    const blackoutControls = (experience.blackoutRanges ?? []).map((range) =>
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
    });

    this.setCoverImagePreviewFromExperience(experience);

    if (experience.scope === 'PROPERTY' && experience.propertyId) {
      this.propertyChanged.emit(experience.propertyId);
    }
  }

  private syncAvailabilityValidators(type: ExperienceAvailabilityType): void {
    const { startAt, endAt, recurrence } = this.form.controls;
    const { daysOfWeek, startTime, endTime } = recurrence.controls;

    if (type === 'RECURRING') {
      startAt.clearValidators();
      endAt.clearValidators();
      daysOfWeek.setValidators([Validators.required]);
      startTime.setValidators([Validators.required]);
      endTime.setValidators([Validators.required]);
    } else {
      startAt.setValidators([Validators.required]);
      endAt.setValidators([Validators.required]);
      daysOfWeek.clearValidators();
      startTime.clearValidators();
      endTime.clearValidators();
    }

    [startAt, endAt, daysOfWeek, startTime, endTime].forEach((c) =>
      c.updateValueAndValidity({ emitEvent: false }),
    );
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
        lat: raw.location.lat,
        lng: raw.location.lng,
      },
      allowStandalonePurchase: true,
      allowReservationPurchase: true,
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

  private createBlackoutRangeGroup(
    startAt: string | null = null,
    endAt: string | null = null,
  ): FormGroup<BlackoutRangeFormControls> {
    return this.fb.group<BlackoutRangeFormControls>({
      startAt: this.fb.control<string | null>(startAt),
      endAt: this.fb.control<string | null>(endAt),
    });
  }

  // ─── Private — date helpers ────────────────────────────────────────────────

  private toLocalDateTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toIsoDateTime(localValue: string): string {
    const date = new Date(localValue);
    return Number.isNaN(date.getTime()) ? localValue : date.toISOString();
  }

  // ─── Private — cover image ─────────────────────────────────────────────────

  private coverImageObjectUrl: string | null = null;

  private setCoverImagePreview(file: File): void {
    this.revokeCoverImageObjectUrl();
    this.selectedCoverImageFile.set(file);
    this.coverImageObjectUrl = URL.createObjectURL(file);
    this.coverImagePreviewUrl.set(this.coverImageObjectUrl);
    this.form.controls.coverImageUrl.setValue(this.coverImageObjectUrl);
    this.form.controls.coverImageUrl.markAsDirty();
    this.form.controls.coverImageUrl.updateValueAndValidity();
  }

  private setCoverImagePreviewFromExperience(experience: Experience): void {
    this.revokeCoverImageObjectUrl();
    this.selectedCoverImageFile.set(null);
    this.coverImagePreviewUrl.set(experience.coverImageUrl || null);
    this.form.controls.coverImageUrl.setValue(experience.coverImageUrl ?? '');
    this.form.controls.coverImageUrl.updateValueAndValidity({ emitEvent: false });
  }

  private clearCoverImageSelection(): void {
    this.revokeCoverImageObjectUrl();
    this.selectedCoverImageFile.set(null);
    this.coverImagePreviewUrl.set(null);
    this.form.controls.coverImageUrl.setValue('');
    this.form.controls.coverImageUrl.markAsDirty();
    this.form.controls.coverImageUrl.markAsTouched();
    this.form.controls.coverImageUrl.updateValueAndValidity();
  }

  private revokeCoverImageObjectUrl(): void {
    if (!this.coverImageObjectUrl) return;
    URL.revokeObjectURL(this.coverImageObjectUrl);
    this.coverImageObjectUrl = null;
  }
}
