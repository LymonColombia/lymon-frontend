import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { RecoverPasswordUseCase } from '@/domain/tenant/auth/use-cases/recover-password.use-case';
import { AuthText, authText } from '@/presentation/tenant/features/auth/i18n/auth-i18n';

/** Seconds before the "resend link" button works again. */
const RESEND_COOLDOWN = 30;

@Component({
  selector: 'app-recover-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recover-password.html',
  styleUrls: ['../../styles/auth-shell.css', '../../styles/forgot.css'],
})
export class RecoverPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly recoverPasswordUseCase = inject(RecoverPasswordUseCase);

  readonly t = authText('forgot');

  readonly isLoading = signal(false);
  readonly submitted = signal(false);
  /** Seconds left until the link can be sent again; 0 means it can. */
  readonly wait = signal(0);

  private readonly errorKey = signal<keyof AuthText['forgot']['errors'] | null>(null);
  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return key ? this.t().errors[key] : null;
  });

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopCooldown());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.send();
  }

  /** Send the link again, once the cooldown is over. */
  onResend(): void {
    if (this.wait() === 0) this.send();
  }

  /** Back to the form to type a different email. */
  onOtherEmail(): void {
    this.stopCooldown();
    this.errorKey.set(null);
    this.submitted.set(false);
  }

  private send(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.errorKey.set(null);

    const { email } = this.form.getRawValue();

    this.recoverPasswordUseCase.execute({ email: email! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submitted.set(true);
        this.startCooldown();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorKey.set(err.status === 400 ? 'invalidEmail' : 'unexpected');
      },
    });
  }

  private startCooldown(): void {
    this.stopCooldown();
    this.wait.set(RESEND_COOLDOWN);
    this.timer = setInterval(() => {
      this.wait.update((w) => Math.max(0, w - 1));
      if (this.wait() === 0) this.stopCooldown();
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.wait.set(0);
  }

  get emailControl() {
    return this.form.controls.email;
  }
}
