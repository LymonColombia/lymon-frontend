import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { TenantPageLayoutComponent } from '@/presentation/tenant/layout/tenant-page-layout/tenant-page-layout';
import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { UpdateTenantProfileUseCase } from '@/domain/use-cases/tenant/update-tenant-profile.use-case';
import { ChangePasswordUseCase } from '@/domain/use-cases/user/change-password.use-case';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapEye,
  bootstrapEyeSlash,
  bootstrapPersonGear,
} from '@ng-icons/bootstrap-icons';

function passwordsDifferentValidator(control: AbstractControl): ValidationErrors | null {
  const current = control.get('currentPassword')?.value;
  const next = control.get('newPassword')?.value;
  if (current && next) {
    return current !== next ? null : { samePassword: true };
  }
  return null;
}

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TenantPageLayoutComponent,
    NgIcon,
    ButtonComponent,
    InputComponent,
  ],
  providers: [provideIcons({ bootstrapEye, bootstrapEyeSlash, bootstrapPersonGear })],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly getTenantProfileUseCase = inject(GetTenantProfileUseCase);
  private readonly updateTenantProfileUseCase = inject(UpdateTenantProfileUseCase);
  private readonly changePasswordUseCase = inject(ChangePasswordUseCase);
  private readonly userSession = inject(UserSessionService);

  readonly isLoadingProfile = signal(true);
  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly tenantName = signal('');
  readonly tenantEmail = signal('');

  readonly tenantForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
  });

  readonly passwordForm = this.fb.group(
    {
      currentPassword: [''],
      newPassword: [''],
      confirmNewPassword: [''],
    },
    { validators: passwordsDifferentValidator },
  );

  ngOnInit(): void {
    this.getTenantProfileUseCase.execute().subscribe({
      next: (res) => {
        const p = res.data;
        this.tenantName.set(p.name ?? '');
        this.tenantEmail.set(p.email ?? this.userSession.currentUser()?.email ?? '');
        this.tenantForm.patchValue({
          name: p.name ?? '',
        });
        this.isLoadingProfile.set(false);
      },
      error: () => {
        this.isLoadingProfile.set(false);
        this.tenantEmail.set(this.userSession.currentUser()?.email ?? '');
        this.errorMessage.set('No se pudo cargar la configuración. Inténtalo de nuevo.');
      },
    });
  }

  onSubmitAll(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const profileValid = this.tenantForm.valid;
    const rawPassword = this.passwordForm.getRawValue();
    const passwordFilled = !!rawPassword.currentPassword && rawPassword.currentPassword.length > 0;
    const passwordValid = passwordFilled ? this.passwordForm.valid : true;

    if (!profileValid) {
      this.tenantForm.markAllAsTouched();
    }
    if (passwordFilled && !passwordValid) {
      this.passwordForm.markAllAsTouched();
    }
    if (!profileValid || !passwordValid) {
      return;
    }

    this.isSubmitting.set(true);

    const profileObs = this.updateTenantProfileUseCase.execute({
      name: this.tenantForm.getRawValue().name || undefined,
    });

    const passwordObs = passwordFilled
      ? this.changePasswordUseCase.execute({
          currentPassword: rawPassword.currentPassword!,
          newPassword: rawPassword.newPassword!,
          newPasswordConfirmation: rawPassword.confirmNewPassword!,
        })
      : null;

    profileObs.subscribe({
      next: () => {
        if (passwordObs === null) {
          this.isSubmitting.set(false);
          this.successMessage.set('Cambios guardados exitosamente.');
          this.passwordForm.reset();
        } else {
          passwordObs.subscribe({
            next: () => {
              this.isSubmitting.set(false);
              this.successMessage.set('Cambios guardados exitosamente.');
              this.passwordForm.reset();
            },
            error: (err: HttpErrorResponse) => {
              this.isSubmitting.set(false);
              if (err.status === 401) {
                this.errorMessage.set('La contraseña actual es incorrecta.');
              } else if (err.status === 400) {
                this.errorMessage.set('Datos inválidos en la contraseña.');
              } else {
                this.errorMessage.set('Ocurrió un error al cambiar la contraseña.');
              }
            },
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.status === 400) {
          this.errorMessage.set('Datos inválidos. Verifica los campos e intenta de nuevo.');
        } else if (err.status === 403) {
          this.errorMessage.set('No tienes permiso para editar el perfil.');
        } else {
          this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
        }
      },
    });
  }

  get nameControl() {
    return this.tenantForm.controls.name;
  }

  get currentPasswordControl() {
    return this.passwordForm.controls.currentPassword;
  }
  get newPasswordControl() {
    return this.passwordForm.controls.newPassword;
  }
  get confirmNewPasswordControl() {
    return this.passwordForm.controls.confirmNewPassword;
  }

  get passwordsMismatch(): boolean {
    const { newPassword, confirmNewPassword } = this.passwordForm.getRawValue();
    return (
      !!confirmNewPassword &&
      !!newPassword &&
      newPassword !== confirmNewPassword &&
      (this.confirmNewPasswordControl.touched || this.passwordForm.touched)
    );
  }

  get samePassword(): boolean {
    return this.passwordForm.hasError('samePassword') && this.newPasswordControl.touched;
  }
}
