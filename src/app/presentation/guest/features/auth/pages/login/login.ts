import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GuestLoginUseCase } from '@/domain/use-cases/guest/guest-login.use-case';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowRightCircleFill,
  bootstrapEnvelope,
} from '@ng-icons/bootstrap-icons';
import { PasswordInputComponent } from '@/presentation/shared/components/password-input/password-input';
import { AuthTypeToggleComponent } from '@/presentation/shared/components/auth-type-toggle/auth-type-toggle';

@Component({
  selector: 'app-guest-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NgIcon, PasswordInputComponent, AuthTypeToggleComponent],
  providers: [provideIcons({ bootstrapEnvelope, bootstrapArrowRightCircleFill })],
  templateUrl: './login.html',
  styleUrls: ['../../../../../shared/styles/auth-form.css'],
})
export class GuestLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly loginUseCase = inject(GuestLoginUseCase);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly emailNotVerified = signal(false);
  readonly sessionExpired = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('sessionExpired') === 'true',
  );

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.emailNotVerified.set(false);

    const { email, password } = this.form.getRawValue();

    this.loginUseCase.execute({ email: email!, password: password! }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (!res.emailVerified) {
          this.emailNotVerified.set(true);
        }
        this.router.navigate(['/booking']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Correo o contraseña incorrectos.');
        } else if (err.status === 400) {
          this.errorMessage.set('Datos inválidos. Verifica los campos.');
        } else {
          this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
        }
      },
    });
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }
}
