import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { FieldLabelComponent } from '@/presentation/tenant/features/units/pages/property-units/components/field-label/field-label';
import { TooltipComponent } from '@/presentation/tenant/components/tooltip/tooltip';
import {
  MediaGalleryInputComponent,
  MediaGallerySelection,
} from '@/presentation/tenant/components/media-gallery-input/media-gallery-input';
import { CreateUnitUseCase } from '@/domain/use-cases/property/create-unit.use-case';
import { UpdateUnitUseCase } from '@/domain/use-cases/property/update-unit.use-case';
import { UpdateUnitMediaKeysUseCase } from '@/domain/use-cases/property/update-unit-media-keys.use-case';
import { CreateImageStorageUseCase } from '@/domain/use-cases/image-storage/image-storage.use-case';
import { BedDto, BedType, UpdateUnitDto } from '@/domain/entities/property.model';
import { Unit } from '@/domain/entities/staff.model';
import { MediaItem, keyFromMediaUrl } from '@/domain/entities/storage.model';
import { ROOM_MESSAGES } from '@/domain/constants/room.constants';

const AMENITY_OPTIONS = [
  'WiFi',
  'Aire Acondicionado',
  'TV',
  'Mini Bar',
  'Cafetera',
  'Baño Privado',
  'Bañera',
  'Balcón',
  'Vista al Mar',
  'Calefacción',
  'Caja Fuerte',
  'Escritorio',
  'Secador de Pelo',
  'Plancha',
  'Cocina',
];

const BED_TYPES: BedType[] = ['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'SOFA_BED'];

const BED_TYPE_LABELS: Record<BedType, string> = {
  SINGLE: 'Sencilla',
  DOUBLE: 'Doble',
  SOFA_BED: 'Sofá cama',
  KING: 'King',
  QUEEN: 'Queen',
};

@Component({
  selector: 'app-unit-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent, FieldLabelComponent, TooltipComponent, MediaGalleryInputComponent],
  templateUrl: './unit-form-modal.html',
  styleUrl: './unit-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly createUnitUseCase = inject(CreateUnitUseCase);
  private readonly updateUnitUseCase = inject(UpdateUnitUseCase);
  private readonly updateUnitMediaKeysUseCase = inject(UpdateUnitMediaKeysUseCase);
  private readonly createImageStorageUseCase = inject(CreateImageStorageUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly propertyId = input.required<string>();
  readonly unitToEdit = input<Unit | null>(null);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedAmenities = signal<Set<string>>(new Set());
  readonly galleryInitialItems = signal<MediaItem[]>([]);
  readonly gallerySelection = signal<MediaGallerySelection>({ kept: [], newFiles: [] });
  readonly isEditMode = computed(() => this.unitToEdit() !== null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly AMENITY_OPTIONS = AMENITY_OPTIONS;
  readonly bedTypeOptions: SelectOption[] = BED_TYPES.map((type) => ({ value: type, label: BED_TYPE_LABELS[type] }));

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    pricePerNight: [null as number | null, [Validators.required, Validators.min(0.01)]],
    inventoryCount: [1, [Validators.required, Validators.min(1)]],
    maxGuests: [2, [Validators.required, Validators.min(1)]],
    bathroomsCount: [1, [Validators.required, Validators.min(1)]],
    beds: this.fb.array([this.buildBed()], Validators.required),
  });

  constructor() {
    effect(() => {
      const unit = this.unitToEdit();
      if (unit) this.populateForm(unit);
    });
  }

  get beds(): FormArray {
    return this.form.controls.beds;
  }

  getBedAt(index: number): FormGroup {
    return this.beds.at(index) as FormGroup;
  }

  private populateForm(unit: Unit): void {
    this.form.patchValue({
      name: unit.name,
      description: unit.description ?? '',
      pricePerNight: unit.pricePerNight ?? null,
      inventoryCount: unit.inventoryCount ?? 1,
      maxGuests: unit.maxGuests ?? 2,
      bathroomsCount: unit.bathroomsCount ?? 1,
    });

    this.beds.clear();
    const bedsData = unit.bedrooms?.[0]?.beds ?? [];
    for (const bed of bedsData) {
      this.beds.push(this.buildBed(bed.type as BedType, bed.count));
    }
    if (this.beds.length === 0) {
      this.beds.push(this.buildBed());
    }

    this.selectedAmenities.set(new Set(unit.amenities ?? []));

    this.galleryInitialItems.set(
      (unit.mediaUrls ?? []).map((url) => ({ key: keyFromMediaUrl(url), url })),
    );
  }

  onGallerySelectionChange(selection: MediaGallerySelection): void {
    this.gallerySelection.set(selection);
  }

  private buildBed(type: BedType = 'QUEEN', count: number = 1): FormGroup {
    return this.fb.group({
      type: [type, Validators.required],
      count: [count, [Validators.required, Validators.min(1)]],
    });
  }

  addBed(): void {
    this.beds.push(this.buildBed());
  }

  removeBed(index: number): void {
    if (this.beds.length > 1) {
      this.beds.removeAt(index);
    }
  }

  toggleAmenity(name: string): void {
    this.selectedAmenities.update((set) => {
      const next = new Set(set);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  isAmenitySelected(name: string): boolean {
    return this.selectedAmenities().has(name);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const updateDto = this.buildUpdateDto();
    const editingId = this.unitToEdit()?.id;
    const selection = this.gallerySelection();

    const errorFallback = editingId
      ? ROOM_MESSAGES.updateErrorFallback
      : ROOM_MESSAGES.createErrorFallback;

    // Upload new photos first (no unit id needed), keeping the returned keys.
    const newKeys$: Observable<string[]> = selection.newFiles.length
      ? forkJoin(
        selection.newFiles.map((file) =>
          this.createImageStorageUseCase
            .execute({ file, category: 'units' })
            .pipe(map(({ key }) => key)),
        ),
      )
      : of([]);

    newKeys$
      .pipe(
        switchMap((newKeys) => {
          const save$ = editingId
            ? this.updateUnitUseCase.execute(editingId, updateDto)
            : this.createUnitUseCase.execute({ propertyId: this.propertyId(), ...updateDto });
          return save$.pipe(map((response) => ({ response, newKeys })));
        }),
        switchMap(({ response, newKeys }) => {
          const unitId = editingId ?? this.extractUnitId(response);
          const mediaKeys = [...selection.kept.map((item) => item.key), ...newKeys];
          // Replace-all sync: always on edit (handles removals); on create only when photos were added.
          const shouldSync = unitId && (editingId ? true : newKeys.length > 0);
          return shouldSync
            ? this.updateUnitMediaKeysUseCase.execute(unitId!, mediaKeys)
            : of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.saved.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message ?? errorFallback);
        },
      });
  }

  // ponytail: covers the known NestJS create-response shapes; null means we skip media sync
  private extractUnitId(response: unknown): string | null {
    const body = response as { id?: string; data?: { unitId?: string; id?: string; unit?: { id?: string } } };
    return body?.data?.unitId ?? body?.data?.unit?.id ?? body?.data?.id ?? body?.id ?? null;
  }

  private buildUpdateDto(): UpdateUnitDto {
    const raw = this.form.getRawValue();
    return {
      name: raw.name ?? '',
      description: raw.description ?? '',
      inventoryCount: raw.inventoryCount ?? 1,
      maxGuests: raw.maxGuests ?? 1,
      standardGuests: raw.maxGuests ?? 1,
      bathroomsCount: raw.bathroomsCount ?? 1,
      isShared: false,
      pricePerNight: raw.pricePerNight ?? 0,
      amenities: [...this.selectedAmenities()],
      bedrooms: [
        {
          roomName: raw.name ?? '',
          beds: raw.beds as BedDto[],
        },
      ],
      externalIds: {},
    };
  }
}
