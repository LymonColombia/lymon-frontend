import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmRecoverPasswordUseCase } from '@/domain/tenant/auth/use-cases/confirm-recover-password.use-case';
import { AuthText, authText } from '@/presentation/tenant/features/auth/i18n/auth-i18n';
import { passwordStrength } from '@/presentation/tenant/features/auth/password-strength';

export { passwordStrength };

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const newPasswordConfirmation = control.get('newPasswordConfirmation')?.value;
  return newPassword === newPasswordConfirmation ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-confirm-recover-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recover-password-confirm.html',
  styleUrls: ['../../styles/auth-shell.css', '../../styles/forgot.css'],
})
export class ConfirmRecoverPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly confirmUseCase = inject(ConfirmRecoverPasswordUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly t = authText('reset');

  readonly isLoading = signal(false);
  readonly done = signal(false);
  readonly token = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);

  private readonly errorKey = signal<keyof AuthText['reset']['errors'] | null>(null);
  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return key ? this.t().errors[key] : null;
  });

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPasswordConfirmation: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  private readonly newPassword = toSignal(this.form.controls.newPassword.valueChanges, { initialValue: '' });
  readonly strength = computed(() => passwordStrength(this.newPassword() ?? ''));
  readonly strengthWord = computed(() => {
    const s = this.strength();
    return s ? this.t().strength[String(s) as keyof AuthText['reset']['strength']] : '';
  });

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
    this.errorKey.set(null);

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
          this.done.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorKey.set(err.status === 400 ? 'invalidLink' : 'unexpected');
        },
      });
  }

  get newPasswordControl() {
    return this.form.controls.newPassword;
  }

  get newPasswordConfirmationControl() {
    return this.form.controls.newPasswordConfirmation;
  }

  /** The confirmation is filled in but differs from the new password. */
  get passwordsMismatch(): boolean {
    return (
      this.form.hasError('passwordsMismatch') &&
      this.newPasswordConfirmationControl.touched &&
      !!this.newPasswordConfirmationControl.value
    );
  }
}
