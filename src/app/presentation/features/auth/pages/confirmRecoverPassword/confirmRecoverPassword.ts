import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmRecoverPasswordUseCase } from '@/domain/use-cases/auth/confirm-recover-password.use-case';
import { HttpErrorResponse } from '@angular/common/http';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const newPasswordConfirmation = control.get('newPasswordConfirmation')?.value;
  return newPassword === newPasswordConfirmation ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-confirm-recover-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './confirmRecoverPassword.html',
  styleUrls: ['../../auth-form.css'],
})
export class ConfirmRecoverPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly confirmUseCase = inject(ConfirmRecoverPasswordUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly token = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPasswordConfirmation: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/recover-password']);
      return;
    }
    this.token.set(token);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { newPassword, newPasswordConfirmation } = this.form.getRawValue();

    this.confirmUseCase
      .execute({
        token: this.token()!,
        newPassword: newPassword!,
        newPasswordConfirmation: newPasswordConfirmation!,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/login']);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 400) {
            this.errorMessage.set('El enlace es inválido o ha expirado.');
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
