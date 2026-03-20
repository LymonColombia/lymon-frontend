import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  HotelPageLayoutComponent,
  HotelPageMetaDirective,
} from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { SelectOption } from '@/presentation/shared/components/select/select.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { PropertyFormComponent } from './components/property-form/property-form.component';
import { PropertyCardComponent } from './components/property-card/property-card.component';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { CreatePropertyUseCase } from '@/domain/use-cases/property/create-property.use-case';
import { Property } from '@/domain/entities/staff.model';
import { CancellationPolicy, PropertyType } from '@/domain/entities/property.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapHouseDoorFill, bootstrapPlus } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HotelPageLayoutComponent,
    HotelPageMetaDirective,
    ButtonComponent,
    ModalComponent,
    PropertyFormComponent,
    PropertyCardComponent,
    NgIcon,
  ],
  providers: [provideIcons({ bootstrapHouseDoorFill, bootstrapPlus })],
  templateUrl: './properties.html',
  styleUrls: ['./properties.css'],
})
export class PropertiesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly createPropertyUseCase = inject(CreatePropertyUseCase);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly showForm = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly properties = signal<Property[]>([]);

  readonly PROPERTY_TYPES: PropertyType[] = ['HOTEL', 'CASA', 'APARTAMENTO', 'VILLA', 'HOSTAL', 'GLAMPING'];
  readonly CANCELLATION_POLICIES: CancellationPolicy[] = ['FLEXIBLE', 'STANDARD', 'STRICT'];
  readonly propertyTypeOptions: SelectOption[] = this.PROPERTY_TYPES.map((type) => ({
    value: type,
    label: type,
  }));
  readonly cancellationPolicyOptions: SelectOption[] = this.CANCELLATION_POLICIES.map((policy) => ({
    value: policy,
    label: policy,
  }));

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    propertyType: ['HOTEL' as PropertyType, Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
    zipCode: ['', Validators.required],
    lat: [null as number | null, [Validators.required, Validators.min(-90), Validators.max(90)]],
    lng: [null as number | null, [Validators.required, Validators.min(-180), Validators.max(180)]],
    checkInTime: ['', Validators.required],
    checkOutTime: ['', Validators.required],
    cancellationPolicy: ['FLEXIBLE' as CancellationPolicy, Validators.required],
    hostPhone: ['', Validators.required],
    hostEmail: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading.set(true);
    this.getPropertiesUseCase.execute().subscribe({
      next: (props) => {
        this.properties.set(props);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las propiedades.');
        this.isLoading.set(false);
      },
    });
  }

  openForm(): void {
    this.showForm.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  cancelForm(): void {
    this.closeForm();
    this.form.reset({ propertyType: 'HOTEL', cancellationPolicy: 'FLEXIBLE' });
  }

  navigateToUnits(propertyId: string): void {
    this.router.navigate(['/property-units'], { queryParams: { propertyId } });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const dto = {
      name: raw.name!,
      description: raw.description!,
      propertyType: raw.propertyType!,
      address: raw.address!,
      city: raw.city!,
      state: raw.state!,
      country: raw.country!,
      zipCode: raw.zipCode!,
      location: { lat: raw.lat!, lng: raw.lng! },
      checkInTime: raw.checkInTime!,
      checkOutTime: raw.checkOutTime!,
      cancellationPolicy: raw.cancellationPolicy!,
      hostPhone: raw.hostPhone!,
      hostEmail: raw.hostEmail!,
    };

    this.createPropertyUseCase.execute(dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('Propiedad creada correctamente.');
        this.showForm.set(false);
        this.form.reset({ propertyType: 'HOTEL', cancellationPolicy: 'FLEXIBLE' });
        this.loadProperties();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          err.error?.message ?? 'Error al crear la propiedad. Inténtalo de nuevo.',
        );
      },
    });
  }
}
