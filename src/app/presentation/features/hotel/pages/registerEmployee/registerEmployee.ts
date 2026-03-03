import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';
import { AddStaffUseCase } from '@/domain/use-cases/add-staff.use-case';
import { GetRolesUseCase } from '@/domain/use-cases/get-roles.use-case';
import { Role, ScopeType } from '@/domain/entities/staff.model';

@Component({
  selector: 'app-register-employee',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SidebarComponent],
  templateUrl: './registerEmployee.html',
  styleUrls: ['./registerEmployee.css'],
})
export class RegisterEmployeeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly addStaffUseCase = inject(AddStaffUseCase);
  private readonly getRolesUseCase = inject(GetRolesUseCase);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly rolesLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly availableRoles = signal<Role[]>([]);

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
      resourceIds: [''],
    });
  }

  addRoleAssignment(): void {
    this.roleAssignments.push(this.buildRoleGroup());
  }

  removeRoleAssignment(index: number): void {
    this.roleAssignments.removeAt(index);
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
        raw.roleAssignments as Array<{ roleId: string; scopeType: ScopeType; resourceIds: string }>
      ).map((r) => {
        if (r.scopeType === this.SCOPE_TENANT) {
          return { roleId: r.roleId, scope: { type: 'TENANT' as const } };
        }
        const resourceIds = r.resourceIds
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        return {
          roleId: r.roleId,
          scope: { type: r.scopeType as 'PROPERTY' | 'UNIT', resourceIds },
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
        this.getRoleGroupAt(0).patchValue({ scopeType: 'TENANT', roleId: '', resourceIds: '' });
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
