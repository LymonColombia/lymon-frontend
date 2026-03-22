import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { AddStaffUseCase } from '@/domain/use-cases/staff/add-staff.use-case';
import { GetRolesUseCase } from '@/domain/use-cases/staff/get-roles.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { Role, Property, Unit, ScopeType } from '@/domain/entities/staff.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import {
  bootstrapEye,
  bootstrapEyeSlash,
  bootstrapLock,
  bootstrapPersonFillAdd,
  bootstrapPlusLg,
  bootstrapShieldLock,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-register-employee',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HotelPageLayoutComponent,
    NgIcon,
    InputComponent,
    SelectComponent,
    ButtonComponent,
  ],
  providers: [
    provideIcons({
      bootstrapEye,
      bootstrapEyeSlash,
      bootstrapLock,
      bootstrapPersonFillAdd,
      bootstrapPlusLg,
      bootstrapShieldLock,
    }),
  ],
  templateUrl: './registerEmployee.html',
  styleUrls: ['./registerEmployee.css'],
})
export class RegisterEmployeeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly addStaffUseCase = inject(AddStaffUseCase);
  private readonly getRolesUseCase = inject(GetRolesUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly rolesLoading = signal(true);
  readonly propertiesLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly availableRoles = signal<Role[]>([]);
  readonly availableProperties = signal<Property[]>([]);
  readonly unitsPerRow = signal<Partial<Record<number, Unit[]>>>({});
  readonly unitsLoadingPerRow = signal<Partial<Record<number, boolean>>>({});

  readonly SCOPE_TENANT: ScopeType = 'TENANT';
  readonly SCOPE_PROPERTY: ScopeType = 'PROPERTY';
  readonly SCOPE_UNIT: ScopeType = 'UNIT';

  readonly scopeTypeOptions: SelectOption[] = [
    { value: this.SCOPE_TENANT, label: 'TENANT — Todo el hotel' },
    { value: this.SCOPE_PROPERTY, label: 'PROPERTY — Propiedad específica' },
    { value: this.SCOPE_UNIT, label: 'UNIT — Unidad específica' },
  ];

  readonly roleSelectOptions = computed<SelectOption[]>(() => {
    if (this.rolesLoading()) {
      return [{ value: '', label: 'Cargando roles...', disabled: true }];
    }

    return [
      { value: '', label: 'Seleccionar...' },
      ...this.availableRoles().map((role) => ({ value: role.id, label: role.name })),
    ];
  });

  readonly propertySelectOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Seleccionar propiedad...' },
    ...this.availableProperties().map((property) => ({
      value: property.id,
      label: `${property.name} — ${property.city}`,
    })),
  ]);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roleAssignments: this.fb.array([this.buildRoleGroup()]),
  });

  ngOnInit(): void {
    this.syncControlDisabledState();

    this.getRolesUseCase.execute().subscribe({
      next: (roles) => {
        this.availableRoles.set(roles);
        this.rolesLoading.set(false);
        this.syncControlDisabledState();
      },
      error: () => {
        this.rolesLoading.set(false);
        this.errorMessage.set('No se pudieron cargar los roles disponibles.');
        this.syncControlDisabledState();
      },
    });

    this.getPropertiesUseCase.execute().subscribe({
      next: (properties) => {
        this.availableProperties.set(properties);
        this.propertiesLoading.set(false);
        this.syncControlDisabledState();
      },
      error: () => {
        this.propertiesLoading.set(false);
        this.syncControlDisabledState();
      },
    });
  }

  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }
  get roleAssignments(): FormArray {
    return this.form.controls.roleAssignments;
  }

  getRoleGroupAt(index: number): FormGroup {
    return this.roleAssignments.at(index) as FormGroup;
  }

  getUnitOptionsForRow(index: number): SelectOption[] {
    const units = this.unitsPerRow()[index] ?? [];
    return units.map((unit) => ({ value: unit.id, label: unit.name }));
  }

  private buildRoleGroup(): FormGroup {
    return this.fb.group({
      roleId: [{ value: '', disabled: this.rolesLoading() }, Validators.required],
      scopeType: ['TENANT' as ScopeType, Validators.required],
      selectedPropertyId: [{ value: '', disabled: this.propertiesLoading() }],
      resourceIds: [[] as string[]],
    });
  }

  private syncControlDisabledState(): void {
    for (let index = 0; index < this.roleAssignments.length; index++) {
      const roleGroup = this.getRoleGroupAt(index);
      const roleControl = roleGroup.get('roleId');
      const selectedPropertyControl = roleGroup.get('selectedPropertyId');

      if (roleControl) {
        if (this.rolesLoading()) {
          roleControl.disable({ emitEvent: false });
        } else {
          roleControl.enable({ emitEvent: false });
        }
      }

      if (selectedPropertyControl) {
        if (this.propertiesLoading()) {
          selectedPropertyControl.disable({ emitEvent: false });
        } else {
          selectedPropertyControl.enable({ emitEvent: false });
        }
      }
    }
  }

  addRoleAssignment(): void {
    this.roleAssignments.push(this.buildRoleGroup());
    this.syncControlDisabledState();
  }

  removeRoleAssignment(index: number): void {
    this.roleAssignments.removeAt(index);
    this.unitsPerRow.update((m) => {
      const c = { ...m };
      delete c[index];
      return c;
    });
    this.unitsLoadingPerRow.update((m) => {
      const c = { ...m };
      delete c[index];
      return c;
    });
  }

  onScopeChange(index: number): void {
    this.getRoleGroupAt(index).patchValue({ resourceIds: [], selectedPropertyId: '' });
    this.unitsPerRow.update((m) => ({ ...m, [index]: [] }));
  }

  onPropertySelectChange(index: number, propertyId: string): void {
    this.getRoleGroupAt(index).patchValue({ resourceIds: [] });
    if (!propertyId) {
      this.unitsPerRow.update((m) => ({ ...m, [index]: [] }));
      return;
    }
    this.unitsLoadingPerRow.update((m) => ({ ...m, [index]: true }));
    this.getUnitsUseCase.execute(propertyId).subscribe({
      next: (units) => {
        this.unitsPerRow.update((m) => ({ ...m, [index]: units }));
        this.unitsLoadingPerRow.update((m) => ({ ...m, [index]: false }));
      },
      error: () => this.unitsLoadingPerRow.update((m) => ({ ...m, [index]: false })),
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onCancel(): void {
    this.router.navigate(['/booking']);
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

    const payload = {
      email: raw.email as string,
      password: raw.password as string,
      roleAssignments: (
        raw.roleAssignments as Array<{
          roleId: string;
          scopeType: ScopeType;
          selectedPropertyId: string;
          resourceIds: string[];
        }>
      ).map((r) => {
        if (r.scopeType === this.SCOPE_TENANT) {
          return { roleId: r.roleId, scope: { type: 'TENANT' as const } };
        }
        return {
          roleId: r.roleId,
          scope: { type: r.scopeType as 'PROPERTY' | 'UNIT', resourceIds: r.resourceIds },
        };
      }),
    };

    this.addStaffUseCase.execute(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Empleado registrado correctamente.');
        this.form.reset();
        while (this.roleAssignments.length > 1) {
          this.roleAssignments.removeAt(1);
        }
        this.getRoleGroupAt(0).patchValue({
          scopeType: 'TENANT',
          roleId: '',
          resourceIds: [],
          selectedPropertyId: '',
        });
        this.unitsPerRow.set({});
        this.unitsLoadingPerRow.set({});
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 409) {
          this.errorMessage.set('Ya existe un empleado con este correo electrónico.');
        } else if (err.status === 401) {
          this.errorMessage.set('No autorizado. Por favor inicia sesión de nuevo.');
        } else if (err.status === 400) {
          this.errorMessage.set(err.error?.message ?? 'Datos inválidos. Verifica los campos.');
        } else {
          this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
        }
      },
    });
  }
}
