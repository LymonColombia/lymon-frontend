import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GuestRecoverPasswordUseCase } from '@/domain/use-cases/guest/guest-recover-password.use-case';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowRightCircleFill,
  bootstrapEnvelope,
  bootstrapChevronLeft
} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-guest-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  providers: [provideIcons({ bootstrapArrowRightCircleFill, bootstrapEnvelope, bootstrapChevronLeft })],
  templateUrl: './forgot-password.html',
  styleUrls: ['../../../auth/auth-form.css'],
})
export class GuestForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly recoverPasswordUseCase = inject(GuestRecoverPasswordUseCase);

  readonly isLoading = signal(false);
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const { email } = this.form.getRawValue();

    this.recoverPasswordUseCase.execute({ email: email! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submitted.set(true);
      },
      error: (_err: HttpErrorResponse) => {
        // Always show the same "check your email" screen — do not reveal if email exists
        this.isLoading.set(false);
        this.submitted.set(true);
      },
    });
  }

  get emailControl() {
    return this.form.controls.email;
  }
}
