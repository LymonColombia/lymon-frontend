import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  TenantPageLayoutComponent,
  TenantPageMetaDirective,
} from '@/presentation/tenant/layout/tenant-page-layout/tenant-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { ModalComponent } from '@/presentation/shared/components/modal/modal';
import { PropertyFormComponent } from './components/property-form/property-form';
import { PropertyCardComponent } from './components/property-card/property-card';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { CreatePropertyUseCase } from '@/domain/use-cases/property/create-property.use-case';
import { UpdatePropertyUseCase } from '@/domain/use-cases/property/update-property.use-case';
import { DeletePropertyUseCase } from '@/domain/use-cases/property/delete-property.use-case';
import { GetPropertyByIdUseCase } from '@/domain/use-cases/property/get-property-by-id.use-case';
import { TutorialService } from '@/presentation/tenant/services/tutorial.service';
import { CancellationPolicy, PropertyDetail, PropertyType, UpdatePropertyDto, Property } from '@/domain/entities/property.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapHouseDoorFill, bootstrapPlus } from '@ng-icons/bootstrap-icons';
import { TutorialHighlightDirective } from '@/presentation/tenant/directives/tutorial-highlight.directive';

@Component({
  selector: 'app-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TenantPageLayoutComponent,
    TenantPageMetaDirective,
    ButtonComponent,
    ModalComponent,
    PropertyFormComponent,
    PropertyCardComponent,
    NgIcon,
    TutorialHighlightDirective,
  ],
  providers: [provideIcons({ bootstrapHouseDoorFill, bootstrapPlus })],
  templateUrl: './properties.html',
  styleUrls: ['./properties.css'],
})
export class PropertiesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly createPropertyUseCase = inject(CreatePropertyUseCase);
  private readonly updatePropertyUseCase = inject(UpdatePropertyUseCase);
  private readonly deletePropertyUseCase = inject(DeletePropertyUseCase);
  private readonly getPropertyByIdUseCase = inject(GetPropertyByIdUseCase);
  private readonly router = inject(Router);
  private readonly tutorialService = inject(TutorialService);

  private formSaved = false;

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isLoadingEdit = signal(false);
  readonly showForm = signal(false);
  readonly showDeleteConfirm = signal(false);
  readonly editingProperty = signal<Property | null>(null);
  readonly propertyToDelete = signal<Property | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly properties = signal<Property[]>([]);

  private static readonly DEFAULT_PROPERTY_TYPE: PropertyType = 'HOTEL';
  private static readonly DEFAULT_CANCELLATION_POLICY: CancellationPolicy = 'STANDARD';
  private static readonly PROPERTY_UNITS_ROUTE = '/admin/units';
  private static readonly PROPERTY_INVENTORY_ROUTE = '/admin/properties';

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    propertyType: [PropertiesComponent.DEFAULT_PROPERTY_TYPE, Validators.required],
    addressLocation: [
      { address: '', lat: null, lng: null } as { address: string; lat: number | null; lng: number | null },
      addressLocationValidator,
    ],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
    zipCode: ['', Validators.required],
    checkInTime: ['', Validators.required],
    checkOutTime: ['', Validators.required],
    cancellationPolicy: [PropertiesComponent.DEFAULT_CANCELLATION_POLICY, Validators.required],
    hostPhone: ['', Validators.required],
    hostEmail: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading.set(true);
    this.getPropertiesUseCase
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.editingProperty.set(null);
    this.resetFormDefaults();
    this.showForm.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingProperty.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (!this.formSaved) {
      this.tutorialService.resetActionButtonClicked(0);
    }
    this.formSaved = false;
  }

  cancelForm(): void {
    this.closeForm();
    this.resetFormDefaults();
  }

  openEditForm(property: Property): void {
    this.isLoadingEdit.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.getPropertyByIdUseCase
      .execute(property.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail: PropertyDetail) => {
          this.form.patchValue({
            name: detail.name,
            description: detail.description,
            addressLocation: {
              address: detail.address,
              lat: detail.location?.lat ?? null,
              lng: detail.location?.lng ?? null,
            } as { address: string; lat: number | null; lng: number | null },
            city: detail.city,
            state: detail.state,
            country: detail.country,
            zipCode: detail.zipCode,
            checkInTime: detail.checkInTime,
            checkOutTime: detail.checkOutTime,
            cancellationPolicy: detail.cancellationPolicy,
            hostPhone: detail.hostPhone,
            hostEmail: detail.hostEmail,
          });
          this.editingProperty.set(property);
          this.showForm.set(true);
          this.isLoadingEdit.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoadingEdit.set(false);
          this.errorMessage.set(err.error?.message ?? 'No se pudo cargar la propiedad para editar.');
        },
      });
  }

  openDeleteConfirm(property: Property): void {
    this.propertyToDelete.set(property);
    this.showDeleteConfirm.set(true);
    this.errorMessage.set(null);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.propertyToDelete.set(null);
  }

  confirmDelete(): void {
    const property = this.propertyToDelete();
    if (!property) {
      return;
    }
    this.isDeleting.set(true);
    this.deletePropertyUseCase
      .execute(property.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.showDeleteConfirm.set(false);
          this.propertyToDelete.set(null);
          this.successMessage.set('Propiedad eliminada correctamente.');
          this.loadProperties();
        },
        error: (err: HttpErrorResponse) => {
          this.isDeleting.set(false);
          this.errorMessage.set(
            err.error?.message ?? 'Error al eliminar la propiedad. Inténtalo de nuevo.',
          );
        },
      });
  }

  navigateToUnits(propertyId: string): void {
    this.router.navigate([PropertiesComponent.PROPERTY_UNITS_ROUTE], { queryParams: { propertyId } });
  }

  navigateToInventory(propertyId: string): void {
    this.router.navigate([PropertiesComponent.PROPERTY_INVENTORY_ROUTE, propertyId, 'inventory']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const dto = this.buildPropertyDto();
    const editingId = this.editingProperty()?.id;
    const action$ = editingId
      ? this.updatePropertyUseCase.execute(editingId, dto)
      : this.createPropertyUseCase.execute(dto);
    const successMsg = editingId
      ? 'Propiedad actualizada correctamente.'
      : 'Propiedad creada correctamente.';
    const errorFallback = editingId
      ? 'Error al actualizar la propiedad. Inténtalo de nuevo.'
      : 'Error al crear la propiedad. Inténtalo de nuevo.';

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.formSaved = true;
        this.successMessage.set(successMsg);
        this.showForm.set(false);
        this.editingProperty.set(null);
        this.resetFormDefaults();
        this.loadProperties();
        this.tutorialService.stepCompleted$.next();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message ?? errorFallback);
      },
    });
  }

  private buildPropertyDto(): UpdatePropertyDto {
    const raw = this.form.getRawValue();
    const addressLocation = raw.addressLocation as unknown as { address: string; lat: number; lng: number };
    return {
      name: raw.name!,
      description: raw.description!,
      propertyType: raw.propertyType!,
      address: addressLocation.address,
      city: raw.city!,
      state: raw.state!,
      country: raw.country!,
      zipCode: raw.zipCode!,
      location: { lat: addressLocation.lat, lng: addressLocation.lng },
      checkInTime: raw.checkInTime!,
      checkOutTime: raw.checkOutTime!,
      cancellationPolicy: raw.cancellationPolicy!,
      hostPhone: raw.hostPhone!,
      hostEmail: raw.hostEmail!,
    };
  }

  private resetFormDefaults(): void {
    this.form.reset({
      addressLocation: { address: '', lat: null, lng: null },
      propertyType: PropertiesComponent.DEFAULT_PROPERTY_TYPE,
      cancellationPolicy: PropertiesComponent.DEFAULT_CANCELLATION_POLICY,
    });
  }
}

function addressLocationValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value?.lat != null && value?.lng != null) {
    return null;
  }
  return { locationRequired: true };
}
