import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { normalizeEmail, minLocalPartLength } from '@/presentation/shared/utils/email.utils';
import { ToastService } from '@/presentation/tenant/services/toast.service';
import { TenantPageLayoutComponent } from '@/presentation/tenant/layout/tenant-page-layout/tenant-page-layout';
import { AddStaffUseCase } from '@/domain/use-cases/staff/add-staff.use-case';
import { GetRolesUseCase } from '@/domain/use-cases/staff/get-roles.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { Role, Property, Unit, ScopeType, InviteStaffDto } from '@/domain/entities/staff.model';
import { EMPLOYEE_MESSAGES, getBackendErrorMessage } from '@/domain/constants/employee-messages.constants';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { InputComponent } from '@/presentation/shared/components/input/input';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { ToastComponent } from '@/presentation/tenant/components/toast/toast';
import { TutorialService } from '@/presentation/tenant/services/tutorial.service';
import { TutorialHighlightDirective } from '@/presentation/tenant/directives/tutorial-highlight.directive';
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
    TenantPageLayoutComponent,
    NgIcon,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    ToastComponent,
    TutorialHighlightDirective,
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
  templateUrl: './register-employee.html',
  styleUrls: ['./register-employee.css'],
})
export class RegisterEmployeeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly addStaffUseCase = inject(AddStaffUseCase);
  private readonly getRolesUseCase = inject(GetRolesUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly router = inject(Router);
  private readonly tutorialService = inject(TutorialService);

  private employeeSaved = false;

  readonly isLoading = signal(false);
  readonly rolesLoading = signal(true);
  readonly propertiesLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly availableRoles = signal<Role[]>([]);
  readonly availableProperties = signal<Property[]>([]);
  readonly unitsPerRow = signal<Partial<Record<number, Unit[]>>>({});
  readonly unitsLoadingPerRow = signal<Partial<Record<number, boolean>>>({});

  readonly SCOPE_TENANT: ScopeType = 'TENANT';
  readonly SCOPE_PROPERTY: ScopeType = 'PROPERTY';
  readonly SCOPE_UNIT: ScopeType = 'UNIT';

  readonly scopeTypeOptions: SelectOption[] = [
    { value: this.SCOPE_TENANT, label: 'Todo el hotel' },
    { value: this.SCOPE_PROPERTY, label: 'Propiedad específica' },
    { value: this.SCOPE_UNIT, label: 'Unidad específica' },
  ];

  readonly roleSelectOptions = computed<SelectOption[]>(() => {
    if (this.rolesLoading()) {
      return [{ value: '', label: 'Cargando roles...', disabled: true }];
    }

    return [
      { value: '', label: 'Seleccionar...' },
      ...this.availableRoles().map((role) => ({
        value: role.id,
        label: EMPLOYEE_MESSAGES.roleLabel[role.name.toUpperCase() as keyof typeof EMPLOYEE_MESSAGES.roleLabel] ?? role.name,
      })),
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
    fullName: ['', [Validators.required]],
    document: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254), minLocalPartLength(8)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roleAssignments: this.fb.array([this.buildRoleGroup()]),
  });

  ngOnInit(): void {
    this.syncControlDisabledState();

    this.email.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const normalized = normalizeEmail(value);
        if (normalized !== value) {
          this.email.setValue(normalized, { emitEvent: false });
        }
      });

    this.getRolesUseCase.execute().subscribe({
      next: (roles) => {
        this.availableRoles.set(roles);
        this.rolesLoading.set(false);
        this.syncControlDisabledState();
      },
      error: () => {
        this.rolesLoading.set(false);
        this.errorMessage.set(EMPLOYEE_MESSAGES.error.loadRoles);
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
  get fullName() {
    return this.form.controls.fullName;
  }
  get document() {
    return this.form.controls.document;
  }
  get roleAssignments(): FormArray {
    return this.form.controls.roleAssignments;
  }

  private readonly errorMessages: Record<string, Record<string, string>> =
    EMPLOYEE_MESSAGES.validation as Record<string, Record<string, string>>;

  private collectControlErrors(control: AbstractControl, fieldName: string): string[] {
    if (!control.errors) return [];
    const map = this.errorMessages[fieldName] ?? {};
    return Object.keys(control.errors)
      .map((errorKey) => map[errorKey])
      .filter((message): message is string => !!message);
  }

  private showValidationErrorsAsToasts(): void {
    const controls = this.form.controls;
    const messages: string[] = [
      ...this.collectControlErrors(controls.fullName, 'fullName'),
      ...this.collectControlErrors(controls.document, 'document'),
      ...this.collectControlErrors(controls.email, 'email'),
      ...this.collectControlErrors(controls.password, 'password'),
    ];

    this.roleAssignments.controls.forEach((group) => {
      const roleGroup = group as FormGroup;
      messages.push(
        ...this.collectControlErrors(roleGroup.controls['roleId'], 'roleId'),
        ...this.collectControlErrors(roleGroup.controls['scopeType'], 'scopeType'),
      );
    });

    messages.forEach((message) => this.toastService.error(message));
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
    if (this.tutorialService.isActive()) {
      this.tutorialService.resetActionButtonClicked(4);
      this.form.reset();
      return;
    }
    this.router.navigate(['/booking']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showValidationErrorsAsToasts();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();

    const payload: InviteStaffDto = {
      email: normalizeEmail(raw.email as string),
      password: raw.password as string,
      fullName: raw.fullName as string,
      document: raw.document as string,
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
        this.employeeSaved = true;
        this.toastService.success(EMPLOYEE_MESSAGES.success.create);
        this.tutorialService.stepCompleted$.next();
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
          this.toastService.error(EMPLOYEE_MESSAGES.error.conflict);
        } else if (err.status === 401) {
          this.toastService.error(EMPLOYEE_MESSAGES.error.unauthorized);
        } else if (err.status === 400) {
          const backendMessage = getBackendErrorMessage(err.error?.message);
          this.toastService.error(backendMessage ?? 'El usuario ya es miembro de este tenant.');
        } else {
          this.toastService.error(EMPLOYEE_MESSAGES.error.unexpected);
        }
      },
    });
  }
}
