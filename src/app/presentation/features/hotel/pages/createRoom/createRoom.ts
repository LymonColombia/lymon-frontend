import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';
import { CreateUnitUseCase } from '@/domain/use-cases/property/create-unit.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
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
  selector: 'app-create-room',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SidebarComponent],
  templateUrl: './createRoom.html',
  styleUrls: ['./createRoom.css'],
})
export class CreateRoomComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly createUnitUseCase = inject(CreateUnitUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);

  readonly propertyId = signal<string | null>(null);
  readonly propertyName = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedAmenities = signal<Set<string>>(new Set());

  readonly AMENITY_OPTIONS = AMENITY_OPTIONS;
  readonly BED_TYPES = BED_TYPES;

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

  ngOnInit(): void {
    const pid = this.route.snapshot.queryParamMap.get('propertyId');
    if (!pid) {
      this.router.navigate(['/properties']);
      return;
    }
    this.propertyId.set(pid);
    this.getPropertiesUseCase.execute().subscribe({
      next: (props) => {
        const found = props.find((p) => p.id === pid);
        this.propertyName.set(found?.name ?? null);
      },
      error: () => {},
    });
  }

  get bedrooms(): FormArray {
    return this.form.controls.bedrooms;
  }

  getBedroomAt(i: number): FormGroup {
    return this.bedrooms.at(i) as FormGroup;
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

  removeBedroom(i: number): void {
    this.bedrooms.removeAt(i);
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
    if (this.propertyId()) {
      this.router.navigate(['/property-units'], { queryParams: { propertyId: this.propertyId() } });
    } else {
      this.router.navigate(['/properties']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const raw = this.form.getRawValue();
    const dto = {
      propertyId: this.propertyId()!,
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
        this.isLoading.set(false);
        this.successMessage.set('Unidad creada correctamente.');
        this.form.reset({
          inventoryCount: 1,
          maxGuests: 2,
          standardGuests: 1,
          bathroomsCount: 1,
          isShared: false,
          pricePerNight: null,
        });
        while (this.bedrooms.length > 1) this.bedrooms.removeAt(1);
        const firstBeds = this.getBedsOf(0);
        firstBeds.clear();
        firstBeds.push(this.buildBed());
        this.getBedroomAt(0).patchValue({ roomName: '' });
        this.selectedAmenities.set(new Set());
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message ?? 'Error al crear la unidad. Inténtalo de nuevo.',
        );
      },
    });
  }
}
