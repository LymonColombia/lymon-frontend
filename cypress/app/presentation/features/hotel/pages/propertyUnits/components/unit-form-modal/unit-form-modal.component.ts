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
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { CreateUnitUseCase } from '@/domain/use-cases/property/create-unit.use-case';
import { UpdateUnitUseCase } from '@/domain/use-cases/property/update-unit.use-case';
import { BedType, BedroomDto, UpdateUnitDto } from '@/domain/entities/property.model';
import { Unit } from '@/domain/entities/staff.model';

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

const BED_TYPES: BedType[] = ['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'BUNK'];

const BED_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Sencilla',
  DOUBLE: 'Doble',
  SOFA_BED: 'Sofa cama',
  KING: 'King',
  QUEEN: 'Queen',
  TWIN: 'Twin',
  BUNK: 'Litera',
};

@Component({
  selector: 'app-unit-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  templateUrl: './unit-form-modal.component.html',
  styleUrl: './unit-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly createUnitUseCase = inject(CreateUnitUseCase);
  private readonly updateUnitUseCase = inject(UpdateUnitUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly propertyId = input.required<string>();
  readonly unitToEdit = input<Unit | null>(null);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedAmenities = signal<Set<string>>(new Set());
  readonly isEditMode = computed(() => this.unitToEdit() !== null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly AMENITY_OPTIONS = AMENITY_OPTIONS;

  constructor() {
    effect(() => {
      const unit = this.unitToEdit();
      if (unit) this.populateForm(unit);
    });
  }
  readonly bedTypeOptions: SelectOption[] = BED_TYPES.map((type) => ({ value: type, label: BED_TYPE_LABELS[type] }));

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    inventoryCount: [1, [Validators.required, Validators.min(1)]],
    maxGuests: [2, [Validators.required, Validators.min(1)]],
    standardGuests: [1, [Validators.required, Validators.min(1)]],
    bathroomsCount: [1, [Validators.required, Validators.min(1)]],
    isShared: [false],
    pricePerNight: [null as number | null, [Validators.required, Validators.min(0)]],
    bedrooms: this.fb.array([this.buildBedroom()]),
    airbnbId: [''],
    bookingId: [''],
    vrboId: [''],
  });

  get bedrooms(): FormArray {
    return this.form.controls.bedrooms;
  }

  getBedroomAt(index: number): FormGroup {
    return this.bedrooms.at(index) as FormGroup;
  }

  getBedsOf(bedroomIndex: number): FormArray {
    return this.getBedroomAt(bedroomIndex).get('beds') as FormArray;
  }

  private populateForm(unit: Unit): void {
    this.form.patchValue({
      name: unit.name,
      description: unit.description ?? '',
      inventoryCount: unit.inventoryCount ?? 1,
      maxGuests: unit.maxGuests ?? 2,
      standardGuests: unit.standardGuests ?? 1,
      bathroomsCount: unit.bathroomsCount ?? 1,
      isShared: unit.isShared ?? false,
      pricePerNight: unit.pricePerNight ?? null,
      airbnbId: unit.externalIds?.airbnbId ?? '',
      bookingId: unit.externalIds?.bookingId ?? '',
      vrboId: unit.externalIds?.vrboId ?? '',
    });

    this.bedrooms.clear();
    const bedroomsData = unit.bedrooms ?? [];
    for (const br of bedroomsData) {
      const bedroomGroup = this.fb.group({
        roomName: [br.roomName, Validators.required],
        beds: this.fb.array(
          br.beds.map(bed =>
            this.fb.group({
              type: [bed.type as BedType, Validators.required],
              count: [bed.count, [Validators.required, Validators.min(1)]],
            }),
          ),
        ),
      });
      this.bedrooms.push(bedroomGroup);
    }
    if (this.bedrooms.length === 0) {
      this.bedrooms.push(this.buildBedroom());
    }

    this.selectedAmenities.set(new Set(unit.amenities ?? []));
  }

  private buildBedroom(): FormGroup {
    return this.fb.group({
      roomName: ['', Validators.required],
      beds: this.fb.array([this.buildBed()]),
    });
  }

  private buildBed(): FormGroup {
    return this.fb.group({
      type: ['QUEEN' as BedType, Validators.required],
      count: [1, [Validators.required, Validators.min(1)]],
    });
  }

  addBedroom(): void {
    this.bedrooms.push(this.buildBedroom());
  }

  removeBedroom(index: number): void {
    this.bedrooms.removeAt(index);
  }

  addBed(bedroomIndex: number): void {
    this.getBedsOf(bedroomIndex).push(this.buildBed());
  }

  removeBed(bedroomIndex: number, bedIndex: number): void {
    this.getBedsOf(bedroomIndex).removeAt(bedIndex);
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
    const unitId = this.unitToEdit()?.id;

    const action$ = unitId
      ? this.updateUnitUseCase.execute(unitId, updateDto)
      : this.createUnitUseCase.execute({ propertyId: this.propertyId(), ...updateDto });

    const errorFallback = unitId
      ? 'Error al actualizar la unidad. Inténtalo de nuevo.'
      : 'Error al crear la unidad. Inténtalo de nuevo.';

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  private buildUpdateDto(): UpdateUnitDto {
    const raw = this.form.getRawValue();
    return {
      name: raw.name ?? '',
      description: raw.description ?? '',
      inventoryCount: raw.inventoryCount ?? 1,
      maxGuests: raw.maxGuests ?? 1,
      standardGuests: raw.standardGuests ?? 1,
      bathroomsCount: raw.bathroomsCount ?? 1,
      isShared: !!raw.isShared,
      pricePerNight: raw.pricePerNight ?? 0,
      amenities: [...this.selectedAmenities()],
      bedrooms: raw.bedrooms as BedroomDto[],
      externalIds: {
        ...(raw.airbnbId ? { airbnbId: raw.airbnbId } : {}),
        ...(raw.bookingId ? { bookingId: raw.bookingId } : {}),
        ...(raw.vrboId ? { vrboId: raw.vrboId } : {}),
      },
    };
  }
}
