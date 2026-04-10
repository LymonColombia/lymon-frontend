import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { CreateUnitUseCase } from '@/domain/use-cases/property/create-unit.use-case';
import { BedType } from '@/domain/entities/property.model';

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

  readonly propertyId = input.required<string>();
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedAmenities = signal<Set<string>>(new Set());

  readonly created = output<void>();
  readonly cancelled = output<void>();

  readonly AMENITY_OPTIONS = AMENITY_OPTIONS;
  readonly bedTypeOptions: SelectOption[] = BED_TYPES.map((type) => ({ value: type, label: type }));

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

    const raw = this.form.getRawValue();
    const dto = {
      propertyId: this.propertyId(),
      name: raw.name!,
      description: raw.description!,
      inventoryCount: raw.inventoryCount!,
      maxGuests: raw.maxGuests!,
      standardGuests: raw.standardGuests!,
      bathroomsCount: raw.bathroomsCount!,
      isShared: !!raw.isShared,
      pricePerNight: raw.pricePerNight!,
      amenities: [...this.selectedAmenities()],
      bedrooms: raw.bedrooms as Array<{
        roomName: string;
        beds: Array<{ type: BedType; count: number }>;
      }>,
      externalIds: {
        ...(raw.airbnbId ? { airbnbId: raw.airbnbId } : {}),
        ...(raw.bookingId ? { bookingId: raw.bookingId } : {}),
        ...(raw.vrboId ? { vrboId: raw.vrboId } : {}),
      },
    };

    this.createUnitUseCase.execute(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.created.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message ?? 'Error al crear la unidad. Inténtalo de nuevo.');
      },
    });
  }
}
