import { ChangeDetectionStrategy, Component, DestroyRef, Input, OnChanges, SimpleChanges, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapTrash, bootstrapFloppy, bootstrapCloudUpload } from '@ng-icons/bootstrap-icons';
import { CreateExperienceDto, Experience } from '@/domain/entities/experience.model';
import {
  DAY_OPTIONS,
  EXPERIENCE_SCOPE_OPTIONS,
  ExperienceFormControls,
  ExperienceFormSubmitPayload,
  isPropertyScope,
  normalizeExperienceScope,
} from '../../models/experience-form.model';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import {
  MediaGalleryInputComponent,
  MediaGallerySelection,
} from '@/presentation/shared/components/media-gallery-input/media-gallery-input.component';
import { MediaItem, keyFromMediaUrl } from '@/domain/entities/storage.model';
import { HotelTooltipComponent } from "@/presentation/features/hotel/components/hotel-tooltip/hotel-tooltip";
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALL_DAY_START_TIME = '00:00';
const ALL_DAY_END_TIME = '23:59';

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, ButtonComponent, SelectComponent, NgIcon, MediaGalleryInputComponent, HotelTooltipComponent],
  providers: [provideIcons({ bootstrapTrash, bootstrapFloppy, bootstrapCloudUpload })],
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @Input() initialExperience: Experience | null = null;
  @Input() isSaving = false;
  @Input() propertyOptions: SelectOption[] = [];
  
  readonly submitted = output<ExperienceFormSubmitPayload>();
  readonly cancelled = output<void>();

  readonly coverImagePreviewUrl = signal<string | null>(null);
  readonly selectedCoverImageFile = signal<File | null>(null);
  readonly coverImageError = signal<string | null>(null);
  readonly galleryInitialItems = signal<MediaItem[]>([]);
  readonly gallerySelection = signal<MediaGallerySelection>({ kept: [], newFiles: [] });
  readonly existingCoverKey = signal<string | null>(null);

  readonly scopeOptions: SelectOption[] = [...EXPERIENCE_SCOPE_OPTIONS];
  readonly dayOptions = DAY_OPTIONS;

  readonly form = this.fb.group<ExperienceFormControls>({
    scope: this.fb.control('PROPERTY', { nonNullable: true, validators: [Validators.required] }),
    propertyId: this.fb.control('', { nonNullable: true }),
    name: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    description: this.fb.control('', { nonNullable: true }),
    city: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    priceCop: this.fb.control<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    capacity: this.fb.control<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    minimumParticipants: this.fb.control<number>(1, {
      nonNullable: true,
      validators: [Validators.min(1)],
    }),
    recurrence: this.fb.group(
      {
        daysOfWeek: this.fb.control<number[]>([], {
          nonNullable: true,
          validators: [Validators.required],
        }),
        startTime: this.fb.control(ALL_DAY_START_TIME, { nonNullable: true }),
        endTime: this.fb.control(ALL_DAY_END_TIME, { nonNullable: true }),
      },
      { nonNullable: true }
    ),
  });

  private appliedExperienceId: string | null = null;
  private coverImageObjectUrl: string | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeCoverImageObjectUrl());
    this.syncPropertyValidators(this.form.controls.scope.value);

    this.form.controls.scope.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scope) => this.syncPropertyValidators(scope));
  }

  ngOnChanges(changes: SimpleChanges): void {
    const experienceChanged = changes['initialExperience'];

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
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.hasCoverImage()) {
      this.coverImageError.set('La imagen de portada es obligatoria');
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

  isDaySelected(day: number): boolean {
    const days = this.form.controls.recurrence.controls.daysOfWeek.value ?? [];
    return days.includes(day);
  }

  toggleDay(day: number): void {
    const control = this.form.controls.recurrence.controls.daysOfWeek;
    const current = control.value ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    control.setValue(next);
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  onCoverImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      this.coverImageError.set('Formato de imagen no válido');
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
    this.form.patchValue(this.toFormValue(experience));

    this.setCoverImagePreviewFromExperience(experience);
    this.galleryInitialItems.set((experience.mediaUrls ?? []).slice(1).map((url) => ({ key: keyFromMediaUrl(url), url })));
  }

  private syncPropertyValidators(scope: string): void {
    const propertyId = this.form.controls.propertyId;

    if (isPropertyScope(scope)) {
      propertyId.setValidators([Validators.required]);
    } else {
      propertyId.clearValidators();
    }

    propertyId.updateValueAndValidity({ emitEvent: false });
  }

  private buildPayload(): CreateExperienceDto {
    const raw = this.form.getRawValue();
    return {
      scope: raw.scope,
      propertyId: raw.scope === 'PROPERTY' && raw.propertyId ? raw.propertyId : undefined,
      name: raw.name,
      description: raw.description.trim() || undefined,
      city: raw.city,
      category: 'TRANSPORTATION',
      priceCop: raw.priceCop,
      minimumParticipants: raw.minimumParticipants ?? 1,
      capacity: raw.capacity,
      availabilityType: 'RECURRING',
      recurrence: {
        daysOfWeek: raw.recurrence.daysOfWeek,
        startTime: ALL_DAY_START_TIME,
        endTime: ALL_DAY_END_TIME,
      },
      allowStandalonePurchase: true,
      allowReservationPurchase: true,
    };
  }

  private toFormValue(experience: Experience) {
    return {
      scope: normalizeExperienceScope(experience.scope ?? (experience.propertyId ? 'PROPERTY' : 'GLOBAL')),
      propertyId: experience.propertyId ?? '',
      name: experience.name,
      description: experience.description ?? '',
      city: experience.city ?? '',
      priceCop: experience.priceCop,
      capacity: experience.capacity,
      minimumParticipants: experience.minimumParticipants ?? 1,
      recurrence: {
        daysOfWeek: experience.recurrence?.daysOfWeek ?? [],
        startTime: ALL_DAY_START_TIME,
        endTime: ALL_DAY_END_TIME,
      },
    };
  }

  private resetFormToDefaults(): void {
    this.form.reset(
      {
        scope: 'PROPERTY',
        propertyId: '',
        name: '',
        description: '',
        city: '',
        priceCop: 0,
        capacity: 0,
        minimumParticipants: 1,
        recurrence: { daysOfWeek: [], startTime: ALL_DAY_START_TIME, endTime: ALL_DAY_END_TIME },
      },
      { emitEvent: false },
    );

    this.syncPropertyValidators('PROPERTY');
    this.revokeCoverImageObjectUrl();
    this.coverImagePreviewUrl.set(null);
    this.selectedCoverImageFile.set(null);
    this.existingCoverKey.set(null);
    this.galleryInitialItems.set([]);
    this.gallerySelection.set({ kept: [], newFiles: [] });
    this.coverImageError.set(null);
  }

  private setCoverImagePreview(file: File): void {
    this.revokeCoverImageObjectUrl();
    this.selectedCoverImageFile.set(file);
    this.existingCoverKey.set(null);
    this.coverImageError.set(null);
    this.coverImageObjectUrl = URL.createObjectURL(file);
    this.coverImagePreviewUrl.set(this.coverImageObjectUrl);
  }

  private setCoverImagePreviewFromExperience(experience: Experience): void {
    this.revokeCoverImageObjectUrl();
    this.selectedCoverImageFile.set(null);
    this.coverImageError.set(null);
    const coverUrl = experience.mediaUrls?.[0] ?? '';
    this.existingCoverKey.set(coverUrl ? keyFromMediaUrl(coverUrl) : null);
    this.coverImagePreviewUrl.set(coverUrl || null);
  }

  private clearCoverImageSelection(): void {
    this.revokeCoverImageObjectUrl();
    this.selectedCoverImageFile.set(null);
    this.existingCoverKey.set(null);
    this.coverImagePreviewUrl.set(null);
    this.coverImageError.set('La imagen de portada es obligatoria');
  }

  private revokeCoverImageObjectUrl(): void {
    if (!this.coverImageObjectUrl) return;
    URL.revokeObjectURL(this.coverImageObjectUrl);
    this.coverImageObjectUrl = null;
  }

  private hasCoverImage(): boolean {
    return Boolean(this.coverImagePreviewUrl() || this.selectedCoverImageFile() || this.existingCoverKey());
  }
}
