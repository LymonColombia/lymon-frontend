import { ChangeDetectionStrategy,ChangeDetectorRef,Component,DestroyRef,Input,OnChanges,SimpleChanges,computed,inject,output,signal} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapTrash, bootstrapFloppy, bootstrapCloudUpload } from '@ng-icons/bootstrap-icons';
import { CreateExperienceDto,Experience,ExperienceAvailabilityType} from '@/domain/entities/experience.model';
import {
  DAY_OPTIONS,
  BlackoutRangeFormControls,
  ExperienceFormControls,
  ExperienceFormSubmitPayload,
} from '../../models/experience-form.model';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { HotelTooltipComponent } from '@/presentation/features/hotel/components/hotel-tooltip/hotel-tooltip';
import {
  AddressMapPickerComponent,
  AddressLocationValue,
} from '@/presentation/shared/components/address-map-picker/address-map-picker.component';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    SelectComponent,
    HotelTooltipComponent,
    NgIcon,
    AddressMapPickerComponent,
  ],
  providers: [provideIcons({ bootstrapTrash, bootstrapFloppy, bootstrapCloudUpload })],
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() initialExperience: Experience | null = null;
  @Input() isSaving = false;
  @Input() propertyOptions: SelectOption[] = [];
  @Input() unitOptions: SelectOption[] = [];
  @Input() unitsLoading = false;

  readonly submitted = output<ExperienceFormSubmitPayload>();
  readonly cancelled = output<void>();
  readonly propertyChanged = output<string>();

  readonly coverImagePreviewUrl = signal<string | null>(null);
  readonly selectedCoverImageFile = signal<File | null>(null);


  readonly categorySignal = signal('TRANSPORTATION');
  readonly availabilityTypeSignal = signal<ExperienceAvailabilityType>('RECURRING');


  readonly isEditingMode = computed(() => Boolean(this.initialExperience));
  readonly isTransportationCategory = computed(() => this.categorySignal() === 'TRANSPORTATION');
  readonly isDateRange = computed(() => this.availabilityTypeSignal() === 'DATE_RANGE');
  readonly isRecurring = computed(() => this.availabilityTypeSignal() === 'RECURRING');
  readonly isOneTime = computed(() => this.availabilityTypeSignal() === 'ONE_TIME');
  readonly showRecurringTimeFields = computed(
    () => this.isRecurring() && !this.isTransportationCategory(),
  );

  private appliedExperienceId: string | null = null;

  readonly categoryOptions: SelectOption[] = [
    { value: 'TRANSPORTATION', label: 'Transporte' },
     {value: 'TRANSP', label: 'Transpo' }
  ];
  
  readonly availabilityTypeOptions = computed<SelectOption[]>(() =>
    this.isTransportationCategory()
      ? [{ value: 'RECURRING', label: 'Recurrencia' }]
      : [
          { value: 'DATE_RANGE', label: 'Rango de Fechas' },
          { value: 'RECURRING', label: 'Recurrencia' },
          { value: 'ONE_TIME', label: 'Una sola vez' },
        ],
  );
  readonly dayOptions = DAY_OPTIONS;

  readonly form = this.fb.group<ExperienceFormControls>({
    propertyId: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    unitIds: this.fb.control<string[]>([], { nonNullable: true }),
    name: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    description: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    category: this.fb.control('TRANSPORTATION', { nonNullable: true, validators: [Validators.required] }),
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
    minimumParticipants: this.fb.control<number | undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    coverImageUrl: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    availabilityType: this.fb.control<ExperienceAvailabilityType>('RECURRING', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startAt: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    endAt: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    blackoutRanges: this.fb.array<FormGroup<BlackoutRangeFormControls>>([]),
    recurrence: this.fb.group({
      daysOfWeek: this.fb.control<number[]>([], {
        nonNullable: true,
        validators: [Validators.required],
      }),
      startTime: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      endTime: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    }),
    locationLabel: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    location: this.fb.control<AddressLocationValue | null>(null, {
      validators: [Validators.required],
    }),
  });

  get blackoutRanges(): FormArray<FormGroup<BlackoutRangeFormControls>> {
    return this.form.controls.blackoutRanges;
  }


  constructor() {
    this.destroyRef.onDestroy(() => this.revokeCoverImageObjectUrl());
    this.syncAvailabilityValidators(this.form.controls.availabilityType.value);
    this.syncLocationValidators(this.form.controls.category.value);
    this.syncDurationValidators(this.form.controls.category.value);
    this.enforceTransportationAvailability(this.form.controls.category.value);

    this.form.controls.category.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((category) => {
        this.categorySignal.set(category);
        this.syncLocationValidators(category);
        this.syncDurationValidators(category);
        this.enforceTransportationAvailability(category);
      });

    this.form.controls.availabilityType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.availabilityTypeSignal.set(type);
        this.syncAvailabilityValidators(type);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const experienceChanged = changes['initialExperience'];
    const optionsChanged = changes['propertyOptions'];

    if (experienceChanged) {
      const experience = experienceChanged.currentValue as Experience | null;

      if (!experience) {
        this.appliedExperienceId = null;
        this.resetFormToDefaults();
        return;
      }

      const isNew = experience.id !== this.appliedExperienceId;
      if (!isNew) return;

      this.applyExperience(experience);
      this.appliedExperienceId = experience.id ?? null;
    }

  
    if (optionsChanged && !optionsChanged.firstChange) {
      const exp = this.initialExperience;
      if (exp?.propertyId) {
        this.propertyChanged.emit(exp.propertyId);
      }
    }
  }


  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit({
      experience: this.buildPayload(),
      coverImageFile: this.selectedCoverImageFile(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
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


  private applyExperience(experience: Experience): void {
    const blackoutControls = (experience.blackoutRanges ?? []).map((range) =>
      this.createBlackoutRangeGroup(
        this.toLocalDateTime(range.startAt),
        this.toLocalDateTime(range.endAt),
      ),
    );
    this.form.setControl('blackoutRanges', this.fb.array(blackoutControls));

    this.form.patchValue(this.toFormValue(experience));

    this.categorySignal.set(experience.category);
    this.availabilityTypeSignal.set(experience.availabilityType);
    this.syncLocationValidators(experience.category);
    this.syncDurationValidators(experience.category);
    this.syncAvailabilityValidators(experience.availabilityType);
    this.enforceTransportationAvailability(experience.category);

    this.setCoverImagePreviewFromExperience(experience);

    if (experience.propertyId) {
      this.propertyChanged.emit(experience.propertyId);
    }

    this.cdr.markForCheck();
  }

  private syncAvailabilityValidators(type: ExperienceAvailabilityType): void {
    const { startAt, endAt, recurrence } = this.form.controls;
    const { daysOfWeek, startTime, endTime } = recurrence.controls;
    const transportation = this.isTransportationCategory();

    if (type === 'RECURRING') {
      startAt.clearValidators();
      endAt.clearValidators();
      daysOfWeek.setValidators([Validators.required]);
      if (transportation) {
        startTime.clearValidators();
        endTime.clearValidators();
      } else {
        startTime.setValidators([Validators.required]);
        endTime.setValidators([Validators.required]);
      }
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

  private syncLocationValidators(category: string): void {
    const locationLabel = this.form.controls.locationLabel;
    const location = this.form.controls.location;
    const required = category !== 'TRANSPORTATION';

    if (required) {
      locationLabel.setValidators([Validators.required]);
      location.setValidators([Validators.required]);
    } else {
      locationLabel.clearValidators();
      location.clearValidators();
    }

    locationLabel.updateValueAndValidity({ emitEvent: false });
    location.updateValueAndValidity({ emitEvent: false });
  }

  private syncDurationValidators(category: string): void {
    const durationHours = this.form.controls.durationHours;

    if (category === 'TRANSPORTATION') {
      durationHours.clearValidators();
    } else {
      durationHours.setValidators([Validators.required, Validators.min(1)]);
    }

    durationHours.updateValueAndValidity({ emitEvent: false });
  }

  private enforceTransportationAvailability(category: string): void {
    if (category !== 'TRANSPORTATION') {
      return;
    }

    this.form.controls.availabilityType.setValue('RECURRING', { emitEvent: false });
    this.availabilityTypeSignal.set('RECURRING');
    this.form.controls.startAt.setValue('', { emitEvent: false });
    this.form.controls.endAt.setValue('', { emitEvent: false });
    this.form.controls.recurrence.controls.startTime.setValue('00:00', { emitEvent: false });
    this.form.controls.recurrence.controls.endTime.setValue('23:59', { emitEvent: false });
    this.syncAvailabilityValidators('RECURRING');
  }


  private buildPayload(): CreateExperienceDto {
    const raw = this.form.getRawValue();
    const location = this.resolveLocation(raw.locationLabel, raw.location);
    return {
      name: raw.name,
      description: raw.description,
      category: raw.category,
      priceCop: raw.priceCop,
      durationHours: this.isTransportationCategory() ? undefined : raw.durationHours,
      capacity: raw.capacity,
      minimumParticipants: raw.minimumParticipants,
      coverImageUrl: raw.coverImageUrl,
      availabilityType: raw.availabilityType,
      propertyId: raw.propertyId,
      unitIds: raw.unitIds,
      startAt: this.resolveStartAt(raw.availabilityType, raw.startAt),
      endAt: this.resolveEndAt(raw.availabilityType, raw.endAt),
      blackoutRanges: this.resolveBlackoutRanges(raw.availabilityType, raw.blackoutRanges),
      recurrence: this.resolveRecurrence(raw.availabilityType, raw.recurrence),
      ...(location ? { location } : {}),
      allowStandalonePurchase: true,
      allowReservationPurchase: true,
    } as CreateExperienceDto;
  }


  private toFormValue(experience: Experience) {
    return {
      propertyId: experience.propertyId ?? '',
      unitIds: experience.unitIds ?? [],
      name: experience.name,
      description: experience.description,
      category: experience.category,
      priceCop: experience.priceCop,
      durationHours: experience.durationHours,
      capacity: experience.capacity,
      minimumParticipants: experience.minimumParticipants,
      coverImageUrl: experience.coverImageUrl,
      availabilityType: experience.availabilityType,
      startAt: this.toLocalDateTime(experience.startAt),
      endAt: this.toLocalDateTime(experience.endAt),
      recurrence: {
        daysOfWeek: experience.recurrence?.daysOfWeek ?? [],
        startTime: experience.recurrence?.startTime ?? '',
        endTime: experience.recurrence?.endTime ?? '',
      },
      locationLabel: experience.location?.label ?? '',
      location: experience.location
        ? {
            address: experience.location.address,
            lat: experience.location.lat,
            lng: experience.location.lng,
          }
        : null,
    };
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

  private resolveStartAt(type: ExperienceAvailabilityType, value: string): string | undefined {
    return type === 'RECURRING' ? undefined : this.toIsoDateTime(value);
  }

  private resolveEndAt(type: ExperienceAvailabilityType, value: string): string | undefined {
    return type === 'RECURRING' ? undefined : this.toIsoDateTime(value);
  }

  private resolveBlackoutRanges(
    type: ExperienceAvailabilityType,
    ranges: Array<{ startAt: string | null; endAt: string | null }>,
  ): Array<{ startAt: string; endAt: string }> | undefined {
    if (type !== 'DATE_RANGE') return undefined;
    return ranges.map((range) => ({
      startAt: this.toIsoDateTime(range.startAt ?? ''),
      endAt: this.toIsoDateTime(range.endAt ?? ''),
    }));
  }

  private resolveRecurrence(
    type: ExperienceAvailabilityType,
    recurrence: Experience['recurrence'],
  ): Experience['recurrence'] | undefined {
    if (type !== 'RECURRING' || !recurrence) return undefined;

    if (this.isTransportationCategory()) {
      return {
        daysOfWeek: recurrence.daysOfWeek,
        startTime: '00:00',
        endTime: '23:59',
      };
    }

    return {
      daysOfWeek: recurrence.daysOfWeek,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
    };
  }

  private resolveLocation(
    label: string,
    location: AddressLocationValue | null,
  ): Experience['location'] | undefined {
    if (!location?.address || !location?.lat || !location?.lng) {
      return undefined;
    }

    if (this.form.controls.category.value !== 'TRANSPORTATION' && !label.trim()) {
      return undefined;
    }

    return {
      label: label.trim() || location.address,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    };
  }

  private resetFormToDefaults(): void {
    this.form.reset({
      propertyId: '',
      unitIds: [],
      name: '',
      description: '',
      category: '',
      priceCop: undefined,
      durationHours: undefined,
      capacity: undefined,
      minimumParticipants: undefined,
      coverImageUrl: '',
      availabilityType: 'DATE_RANGE',
      startAt: '',
      endAt: '',
      recurrence: { daysOfWeek: [], startTime: '', endTime: '' },
      locationLabel: '',
      location: null,
    }, { emitEvent: false });

    this.form.setControl('blackoutRanges', this.fb.array<FormGroup<BlackoutRangeFormControls>>([]));

    this.categorySignal.set('TRANSPORTATION');
    this.availabilityTypeSignal.set('RECURRING');
    this.syncLocationValidators('TRANSPORTATION');
    this.syncDurationValidators('TRANSPORTATION');
    this.enforceTransportationAvailability('TRANSPORTATION');
    this.revokeCoverImageObjectUrl();
    this.coverImagePreviewUrl.set(null);
    this.selectedCoverImageFile.set(null);
  }

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
