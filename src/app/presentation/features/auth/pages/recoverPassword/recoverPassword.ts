import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RecoverPasswordUseCase } from '@/domain/use-cases/auth/recover-password.use-case';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapArrowRightCircleFill, bootstrapEnvelope, bootstrapQuestionCircleFill } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-recover-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  providers: [
    provideIcons({
      bootstrapArrowRightCircleFill,
      bootstrapEnvelope,
      bootstrapQuestionCircleFill
    }),
  ],
  templateUrl: './recoverPassword.html',
  styleUrls: ['../../auth-form.css'],
})
export class RecoverPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly recoverPasswordUseCase = inject(RecoverPasswordUseCase);

  readonly isLoading = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email } = this.form.getRawValue();

    this.recoverPasswordUseCase.execute({ email: email! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submitted.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 400) {
          this.errorMessage.set('Correo inválido. Verifica los campos.');
        } else {
          this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
        }
      },
    });
  }

  get emailControl() {
    return this.form.controls.email;
  }
}
