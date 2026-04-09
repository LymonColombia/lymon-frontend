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
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { UpdateTenantProfileUseCase } from '@/domain/use-cases/tenant/update-tenant-profile.use-case';
import { ChangePasswordUseCase } from '@/domain/use-cases/user/change-password.use-case';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapEye,
  bootstrapEyeSlash,
  bootstrapPersonGear,
} from '@ng-icons/bootstrap-icons';

const URL_PATTERN = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w\-./?%&=]*)?$/;

function passwordsDifferentValidator(control: AbstractControl): ValidationErrors | null {
  const current = control.get('currentPassword')?.value;
  const next = control.get('newPassword')?.value;
  if (!current || !next) return null;
  return current !== next ? null : { samePassword: true };
}

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HotelPageLayoutComponent,
    NgIcon,
    ButtonComponent,
    InputComponent,
  ],
  providers: [provideIcons({ bootstrapEye, bootstrapEyeSlash, bootstrapPersonGear })],
  templateUrl: './tenantSettings.html',
  styleUrl: './tenantSettings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly getTenantProfileUseCase = inject(GetTenantProfileUseCase);
  private readonly updateTenantProfileUseCase = inject(UpdateTenantProfileUseCase);
  private readonly changePasswordUseCase = inject(ChangePasswordUseCase);

  readonly isLoadingProfile = signal(true);
  readonly isSubmittingProfile = signal(false);
  readonly profileSuccessMessage = signal<string | null>(null);
  readonly profileErrorMessage = signal<string | null>(null);

  readonly isSubmittingPassword = signal(false);
  readonly passwordSuccessMessage = signal<string | null>(null);
  readonly passwordErrorMessage = signal<string | null>(null);

  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly tenantForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    contactPhone: ['', [Validators.minLength(7), Validators.maxLength(30)]],
    address: ['', [Validators.maxLength(200)]],
    website: ['', [Validators.pattern(URL_PATTERN)]],
    logoUrl: ['', [Validators.pattern(URL_PATTERN)]],
  });

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required],
    },
    { validators: passwordsDifferentValidator },
  );

  ngOnInit(): void {
    this.getTenantProfileUseCase.execute().subscribe({
      next: (res) => {
        const p = res.data;
        this.tenantForm.patchValue({
          name: p.name ?? '',
          contactPhone: p.contactPhone ?? '',
          address: p.address ?? '',
          website: p.website ?? '',
          logoUrl: p.logoUrl ?? '',
        });
        this.isLoadingProfile.set(false);
      },
      error: () => {
        this.isLoadingProfile.set(false);
        this.profileErrorMessage.set('No se pudo cargar la configuración. Inténtalo de nuevo.');
      },
    });
  }

  onSubmitTenant(): void {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }

    this.isSubmittingProfile.set(true);
    this.profileSuccessMessage.set(null);
    this.profileErrorMessage.set(null);

    const raw = this.tenantForm.getRawValue();

    this.updateTenantProfileUseCase
      .execute({
        name: raw.name || undefined,
        contactPhone: raw.contactPhone || null,
        address: raw.address || null,
        website: raw.website || null,
        logoUrl: raw.logoUrl || null,
      })
      .subscribe({
        next: () => {
          this.isSubmittingProfile.set(false);
          this.profileSuccessMessage.set('Perfil actualizado exitosamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmittingProfile.set(false);
          if (err.status === 400) {
            this.profileErrorMessage.set('Datos inválidos. Verifica los campos e intenta de nuevo.');
          } else if (err.status === 403) {
            this.profileErrorMessage.set('No tienes permiso para editar el perfil.');
          } else {
            this.profileErrorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmNewPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmNewPassword) {
      this.passwordForm.setErrors({ passwordsMismatch: true });
      return;
    }

    this.isSubmittingPassword.set(true);
    this.passwordSuccessMessage.set(null);
    this.passwordErrorMessage.set(null);

    const { currentPassword } = this.passwordForm.getRawValue();

    this.changePasswordUseCase
      .execute({
        currentPassword: currentPassword!,
        newPassword: newPassword!,
        newPasswordConfirmation: confirmNewPassword!,
      })
      .subscribe({
        next: () => {
          this.isSubmittingPassword.set(false);
          this.passwordForm.reset();
          this.passwordSuccessMessage.set('Contraseña actualizada correctamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmittingPassword.set(false);
          if (err.status === 401) {
            this.passwordErrorMessage.set('La contraseña actual es incorrecta.');
          } else if (err.status === 400) {
            this.passwordErrorMessage.set('Datos inválidos. Verifica los campos.');
          } else {
            this.passwordErrorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  get nameControl() {
    return this.tenantForm.controls.name;
  }
  get contactPhoneControl() {
    return this.tenantForm.controls.contactPhone;
  }
  get addressControl() {
    return this.tenantForm.controls.address;
  }
  get websiteControl() {
    return this.tenantForm.controls.website;
  }
  get logoUrlControl() {
    return this.tenantForm.controls.logoUrl;
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
