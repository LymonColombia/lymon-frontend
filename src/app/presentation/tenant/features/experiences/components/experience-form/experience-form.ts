import { ChangeDetectionStrategy,ChangeDetectorRef,Component,DestroyRef,Input,OnChanges,SimpleChanges,computed,inject,output,signal} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapTrash, bootstrapFloppy, bootstrapCloudUpload } from '@ng-icons/bootstrap-icons';
import { CreateExperienceDto,Experience,ExperienceAvailabilityType,ExperienceScope} from '@/domain/entities/experience.model';
import {
  DAY_OPTIONS,
  BlackoutRangeFormControls,
  ExperienceFormControls,
  ExperienceFormSubmitPayload,
} from '../../models/experience-form.model';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { TooltipComponent } from '@/presentation/tenant/components/tooltip/tooltip';
import { MapPickerComponent, MapPickerLocation } from '@/presentation/tenant/features/experiences/components/map-picker/map-picker';
import {
  MediaGalleryInputComponent,
  MediaGallerySelection,
} from '@/presentation/tenant/components/media-gallery-input/media-gallery-input';
import { MediaItem, keyFromMediaUrl } from '@/domain/entities/storage.model';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [ReactiveFormsModule,InputComponent,ButtonComponent,SelectComponent,TooltipComponent,NgIcon,MapPickerComponent,MediaGalleryInputComponent ],
  providers: [provideIcons({ bootstrapTrash, bootstrapFloppy, bootstrapCloudUpload })],
  templateUrl: './experience-form.html',
  styleUrl: './experience-form.css',
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

  readonly galleryInitialItems = signal<MediaItem[]>([]);
  readonly gallerySelection = signal<MediaGallerySelection>({ kept: [], newFiles: [] });
  // Cover key reused on edit when the user doesn't replace the cover; null once a new file is picked.
  readonly existingCoverKey = signal<string | null>(null);


  readonly initialLocationSignal = signal<MapPickerLocation | null>(null);
  readonly scopeSignal = signal<ExperienceScope>('TENANT');
  readonly availabilityTypeSignal = signal<ExperienceAvailabilityType>('DATE_RANGE');


  readonly isEditingMode = computed(() => Boolean(this.initialExperience));
  readonly isPropertyScope = computed(() => this.scopeSignal() === 'PROPERTY');
  readonly isDateRange = computed(() => this.availabilityTypeSignal() === 'DATE_RANGE');
  readonly isRecurring = computed(() => this.availabilityTypeSignal() === 'RECURRING');
  readonly isOneTime = computed(() => this.availabilityTypeSignal() === 'ONE_TIME');

  private appliedExperienceId: string | null = null;

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
      daysOfWeek: this.fb.control<number[]>([], {
        nonNullable: true,
        validators: [Validators.required],
      }),
      startTime: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      endTime: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    }),
    location: this.fb.group({
      label: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      address: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      lat: this.fb.control<number|null>(null, { nonNullable: true, validators: [Validators.required] }),
      lng: this.fb.control<number|null>(null, { nonNullable: true, validators: [Validators.required] }),
    }),
  });

  get blackoutRanges(): FormArray<FormGroup<BlackoutRangeFormControls>> {
    return this.form.controls.blackoutRanges;
  }


  constructor() {
    this.destroyRef.onDestroy(() => this.revokeCoverImageObjectUrl());
    this.syncAvailabilityValidators(this.form.controls.availabilityType.value);

    
    this.form.controls.scope.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.scopeSignal.set(value));

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
      if (exp?.scope === 'PROPERTY' && exp.propertyId) {
        this.propertyChanged.emit(exp.propertyId);
      }
    }
  }


  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const gallery = this.gallerySelection();
    this.submitted.emit({
      experience: this.buildPayload(),
      coverImageFile: this.selectedCoverImageFile(),
      existingCoverKey: this.existingCoverKey(),
      keptMediaItems: gallery.kept,
      newMediaFiles: gallery.newFiles,
    });
  }

  onGallerySelectionChange(selection: MediaGallerySelection): void {
    this.gallerySelection.set(selection);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onLocationChanged(location: MapPickerLocation | null): void {
    this.form.controls.location.patchValue(
      location ? { lat: location.lat, lng: location.lng } : { lat: null, lng: null },
    );
  }

  private getInitialLocationFromExperience(experience: Experience): MapPickerLocation | null {
    const loc = experience.location;
    if (loc?.lat === null || loc?.lng === null) return null;

    return {
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address,
    };
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

    this.scopeSignal.set(experience.scope);
    this.availabilityTypeSignal.set(experience.availabilityType);
    this.syncAvailabilityValidators(experience.availabilityType);

    this.setCoverImagePreviewFromExperience(experience);

    // mediaUrls[0] is the cover; the rest is the gallery.
    this.galleryInitialItems.set(
      (experience.mediaUrls ?? []).slice(1).map((url) => ({ key: keyFromMediaUrl(url), url })),
    );

    this.initialLocationSignal.set(this.getInitialLocationFromExperience(experience));

    if (experience.scope === 'PROPERTY' && experience.propertyId) {
      this.propertyChanged.emit(experience.propertyId);
    }

    this.cdr.markForCheck();
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
    return {
      scope: raw.scope,
      name: raw.name,
      description: raw.description,
      category: raw.category,
      priceCop: raw.priceCop,
      durationHours: raw.durationHours,
      capacity: raw.capacity,
      availabilityType: raw.availabilityType,
      propertyId: raw.scope === 'PROPERTY' ? raw.propertyId || undefined : undefined,
      unitIds: raw.scope === 'PROPERTY' && raw.unitIds?.length ? raw.unitIds : undefined,
      startAt: this.resolveStartAt(raw.availabilityType, raw.startAt),
      endAt: this.resolveEndAt(raw.availabilityType, raw.endAt),
      blackoutRanges: this.resolveBlackoutRanges(raw.availabilityType, raw.blackoutRanges),
      recurrence: this.resolveRecurrence(raw.availabilityType, raw.recurrence),
      location: {
        label: raw.location.label,
        address: raw.location.address,
        lat: raw.location.lat,
        lng: raw.location.lng,
      },
      allowStandalonePurchase: true,
      allowReservationPurchase: true,
    } as CreateExperienceDto;
  }


  private toFormValue(experience: Experience) {
    return {
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
    return {
      daysOfWeek: recurrence.daysOfWeek,
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
    };
  }

  private resetFormToDefaults(): void {
    this.form.reset({
      scope: 'TENANT',
      propertyId: '',
      unitIds: [],
      name: '',
      description: '',
      category: '',
      priceCop: undefined,
      durationHours: undefined,
      capacity: undefined,
      coverImageUrl: '',
      availabilityType: 'DATE_RANGE',
      startAt: '',
      endAt: '',
      recurrence: { daysOfWeek: [], startTime: '', endTime: '' },
      location: { label: '', address: '', lat: 0, lng: 0 },
    }, { emitEvent: false });

    this.form.setControl('blackoutRanges', this.fb.array<FormGroup<BlackoutRangeFormControls>>([]));

   
    this.scopeSignal.set('TENANT');
    this.availabilityTypeSignal.set('DATE_RANGE');
    this.syncAvailabilityValidators('DATE_RANGE');
    this.revokeCoverImageObjectUrl();
    this.coverImagePreviewUrl.set(null);
    this.selectedCoverImageFile.set(null);
    this.existingCoverKey.set(null);
    this.galleryInitialItems.set([]);
    this.initialLocationSignal.set(null);
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
    this.existingCoverKey.set(null); // a new file supersedes the existing cover key
    this.coverImageObjectUrl = URL.createObjectURL(file);
    this.coverImagePreviewUrl.set(this.coverImageObjectUrl);
    this.form.controls.coverImageUrl.setValue(this.coverImageObjectUrl);
    this.form.controls.coverImageUrl.markAsDirty();
    this.form.controls.coverImageUrl.updateValueAndValidity();
  }

  private setCoverImagePreviewFromExperience(experience: Experience): void {
    this.revokeCoverImageObjectUrl();
    this.selectedCoverImageFile.set(null);
    // Cover is mediaUrls[0] under the key-based model (coverImageUrl kept as a fallback).
    const coverUrl = experience.mediaUrls?.[0] ?? experience.coverImageUrl ?? '';
    this.existingCoverKey.set(coverUrl ? keyFromMediaUrl(coverUrl) : null);
    this.coverImagePreviewUrl.set(coverUrl || null);
    this.form.controls.coverImageUrl.setValue(coverUrl);
    this.form.controls.coverImageUrl.updateValueAndValidity({ emitEvent: false });
  }

  private clearCoverImageSelection(): void {
    this.revokeCoverImageObjectUrl();
    this.selectedCoverImageFile.set(null);
    this.existingCoverKey.set(null);
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
