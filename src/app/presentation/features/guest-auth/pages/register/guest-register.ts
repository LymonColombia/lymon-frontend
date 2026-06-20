import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GuestRegisterUseCase } from '@/domain/use-cases/guest/guest-register.use-case';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { PasswordInputComponent } from '@/presentation/shared/components/password-input/password-input.component';
import {
  bootstrapArrowRightCircleFill,
  bootstrapPerson,
  bootstrapEnvelope,
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-guest-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NgIcon, ModalComponent, PasswordInputComponent],
  providers: [
    provideIcons({
      bootstrapArrowRightCircleFill,
      bootstrapPerson,
      bootstrapEnvelope,
    }),
  ],
  templateUrl: './guest-register.html',
  styleUrls: ['../../../auth/auth-form.css'],
})
export class GuestRegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registerUseCase = inject(GuestRegisterUseCase);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly registeredEmail = signal<string | null>(null);
  readonly isTermsOpen = signal(false);

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', [Validators.maxLength(50)]],
    lastName: ['', [Validators.maxLength(50)]],
    terms: [false, Validators.requiredTrue],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { fullName, email, password, firstName, lastName } = this.form.getRawValue();

    this.registerUseCase
      .execute({
        fullName: fullName!,
        email: email!,
        password: password!,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.registeredEmail.set(res.data.email);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (err.status === 409) {
            this.errorMessage.set(
              'Este correo ya está registrado. ¿Quieres iniciar sesión o recuperar tu contraseña?',
            );
          } else if (err.status === 400) {
            this.errorMessage.set('Verifica los campos e inténtalo de nuevo.');
          } else {
            this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
          }
        },
      });
  }

  get fullNameControl() {
    return this.form.controls.fullName;
  }
  get emailControl() {
    return this.form.controls.email;
  }
  get passwordControl() {
    return this.form.controls.password;
  }
  get termsControl() {
    return this.form.controls.terms;
  }

  openTermsModal(): void {
    this.isTermsOpen.set(true);
  }

  closeTermsModal(): void {
    this.isTermsOpen.set(false);
  }
}
