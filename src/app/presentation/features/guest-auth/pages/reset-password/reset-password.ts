import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GuestConfirmRecoverPasswordUseCase } from '@/domain/use-cases/guest/guest-confirm-recover-password.use-case';
import { HttpErrorResponse } from '@angular/common/http';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmation = control.get('newPasswordConfirmation')?.value;
  return password && confirmation && password !== confirmation ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-guest-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['../../../auth/auth-form.css'],
})
export class GuestResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmRecoverPasswordUseCase = inject(GuestConfirmRecoverPasswordUseCase);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly tokenMissing = signal(false);

  private token = '';

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPasswordConfirmation: ['', [Validators.required, Validators.minLength(8)]],
    },
    { validators: passwordsMatchValidator },
  );

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.tokenMissing.set(true);
      return;
    }
    this.token = token;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { newPassword, newPasswordConfirmation } = this.form.getRawValue();

    this.confirmRecoverPasswordUseCase
      .execute({
        token: this.token,
        newPassword: newPassword!,
        newPasswordConfirmation: newPasswordConfirmation!,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('Contraseña cambiada exitosamente. Ya puedes iniciar sesión.');
          setTimeout(() => this.router.navigate(['/guest/login']), 2500);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 401) {
            const msg: string = err.error?.message ?? '';
            if (msg.toLowerCase().includes('match')) {
              this.errorMessage.set('Las contraseñas no coinciden.');
            } else {
              this.errorMessage.set('El enlace de recuperación es inválido o ha expirado.');
            }
          } else {
            this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  get newPasswordControl() {
    return this.form.controls.newPassword;
  }

  get newPasswordConfirmationControl() {
    return this.form.controls.newPasswordConfirmation;
  }

  get passwordsMismatch(): boolean {
    return this.form.hasError('passwordsMismatch') && this.form.touched;
  }
}
