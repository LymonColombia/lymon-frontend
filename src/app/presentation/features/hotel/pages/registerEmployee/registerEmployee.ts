import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';
import { AddStaffUseCase } from '@/domain/use-cases/staff/add-staff.use-case';
import { GetRolesUseCase } from '@/domain/use-cases/staff/get-roles.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { Role, Property, Unit, ScopeType } from '@/domain/entities/staff.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapChevronLeft,
  bootstrapEye,
  bootstrapEyeSlash,
  bootstrapLock,
  bootstrapPersonAdd,
  bootstrapPlusLg,
  bootstrapShieldLock,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-register-employee',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SidebarComponent, NgIcon],
  providers: [
    provideIcons({
      bootstrapChevronLeft,
      bootstrapEye,
      bootstrapEyeSlash,
      bootstrapLock,
      bootstrapPersonAdd,
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

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roleAssignments: this.fb.array([this.buildRoleGroup()]),
  });

  ngOnInit(): void {
    this.getRolesUseCase.execute().subscribe({
      next: (roles) => {
        this.availableRoles.set(roles);
        this.rolesLoading.set(false);
      },
      error: () => {
        this.rolesLoading.set(false);
        this.errorMessage.set('No se pudieron cargar los roles disponibles.');
      },
    });

    this.getPropertiesUseCase.execute().subscribe({
      next: (properties) => {
        this.availableProperties.set(properties);
        this.propertiesLoading.set(false);
      },
      error: () => this.propertiesLoading.set(false),
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

  private buildRoleGroup(): FormGroup {
    return this.fb.group({
      roleId: ['', Validators.required],
      scopeType: ['TENANT' as ScopeType, Validators.required],
      selectedPropertyId: [''],
      resourceIds: [[] as string[]],
    });
  }

  addRoleAssignment(): void {
    this.roleAssignments.push(this.buildRoleGroup());
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
