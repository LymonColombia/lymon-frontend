import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoginUseCase } from '@/domain/tenant/auth/use-cases/login.use-case';
import { TutorialService } from '@/presentation/tenant/services/tutorial.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthText, authText } from '@/presentation/tenant/features/auth/i18n/auth-i18n';
import { LyhostBadgeComponent } from '@/presentation/public/features/landing/pages/lyhost-page/components/lyhost-badge/lyhost-badge';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LyhostBadgeComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly router = inject(Router);
  private readonly tutorialService = inject(TutorialService);

  readonly isLoading = signal(false);
  readonly t = authText('login');

  private readonly errorKey = signal<keyof AuthText['login']['errors'] | null>(null);
  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return key ? this.t().errors[key] : null;
  });
  readonly showPassword = signal(false);
  readonly sessionExpired = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('sessionExpired') === 'true',
  );
  readonly accountCreated = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('registered') === 'true',
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
    this.errorKey.set(null);

    const { email, password } = this.form.getRawValue();

    this.loginUseCase.execute({ email: email!, password: password! }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.user.tutorialCompleted === false) {
          this.tutorialService.start();
        } else {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorKey.set('invalidCredentials');
        } else if (err.status === 400) {
          this.errorKey.set('invalidData');
        } else {
          this.errorKey.set('unexpected');
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
