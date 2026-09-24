import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  ReactiveFormsModule,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HotelPageLayoutComponent } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ChangePasswordUseCase } from '@/domain/use-cases/user/change-password.use-case';
import { HttpErrorResponse } from '@angular/common/http';
import { provideIcons } from '@ng-icons/core';
import { bootstrapPersonLock } from '@ng-icons/bootstrap-icons';

function passwordsDifferentValidator(control: AbstractControl): ValidationErrors | null {
  const current = control.get('currentPassword')?.value;
  const next = control.get('newPassword')?.value;
  if (!current || !next) return null;
  return current !== next ? null : { samePassword: true };
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HotelPageLayoutComponent],
  providers: [provideIcons({ bootstrapPersonLock })],
  templateUrl: './changePassword.html',
  styleUrl: './changePassword.css',
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly changePasswordUseCase = inject(ChangePasswordUseCase);

  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly form = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required],
    },
    { validators: passwordsDifferentValidator },
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmNewPassword } = this.form.getRawValue();
    if (newPassword !== confirmNewPassword) {
      this.form.setErrors({ passwordsMismatch: true });
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const { currentPassword } = this.form.getRawValue();

    this.changePasswordUseCase
      .execute({
        currentPassword: currentPassword!,
        newPassword: newPassword!,
        newPasswordConfirmation: confirmNewPassword!,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.form.reset();
          this.successMessage.set('Contraseña actualizada correctamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 401) {
            this.errorMessage.set('La contraseña actual es incorrecta.');
          } else if (err.status === 400) {
            this.errorMessage.set('Datos inválidos. Verifica los campos.');
          } else {
            this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  get currentPasswordControl() { return this.form.controls.currentPassword; }
  get newPasswordControl() { return this.form.controls.newPassword; }
  get confirmNewPasswordControl() { return this.form.controls.confirmNewPassword; }

  get passwordsMismatch(): boolean {
    const { newPassword, confirmNewPassword } = this.form.getRawValue();
    return (
      !!confirmNewPassword &&
      !!newPassword &&
      newPassword !== confirmNewPassword &&
      (this.confirmNewPasswordControl.touched || this.form.touched)
    );
  }

  get samePassword(): boolean {
    return this.form.hasError('samePassword') && this.newPasswordControl.touched;
  }
}
