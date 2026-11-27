import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterUseCase } from '@/domain/tenant/auth/use-cases/register.use-case';
import { LoginUseCase } from '@/domain/tenant/auth/use-cases/login.use-case';
import { GetPlansUseCase } from '@/domain/shared/plan/use-cases/get-plans.use-case';
import { TokenService } from '@/infrastructure/tenant/services/token.service';
import { UserSessionService } from '@/infrastructure/tenant/services/user-session.service';
import { PlanType } from '@/domain/tenant/auth/auth.model';
import { Plan, isFreePlan } from '@/domain/shared/plan/plan.model';
import { ModalComponent } from '@/presentation/shared/components/modal/modal';
import { AuthText, authText } from '@/presentation/tenant/features/auth/i18n/auth-i18n';
import { passwordStrength } from '@/presentation/tenant/features/auth/password-strength';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

const EXPIRY_REGEX = /^(\d{2})\/(\d{2})$/;

function futureExpiryValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value || typeof value !== 'string') return null;

  const match = EXPIRY_REGEX.exec(value);
  if (!match) return { expiryInvalid: true };

  const month = Number.parseInt(match[1], 10);
  const year = Number.parseInt(match[2], 10) + 2000;
  if (month < 1 || month > 12) return { expiryInvalid: true };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { expiryPast: true };
  }
  return null;
}

export type RegisterStep = 'hotel' | 'email' | 'password' | 'plan' | 'billing';

/** Bar heights of the plan scene, cheapest to most complete. */
const PLAN_BAR_HEIGHTS = [60, 100, 150, 200];

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ModalComponent],
  templateUrl: './register.html',
  styleUrls: ['../../styles/auth-shell.css', './register.css'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registerUseCase = inject(RegisterUseCase);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly getPlansUseCase = inject(GetPlansUseCase);
  private readonly tokenService = inject(TokenService);
  private readonly userSessionService = inject(UserSessionService);
  private readonly router = inject(Router);

  readonly t = authText('register');

  readonly form = this.fb.group({
    hotel: this.fb.group({
      tenantName: ['', Validators.required],
    }),
    account: this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    }),
    password: this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        terms: [false, Validators.requiredTrue],
      },
      { validators: passwordsMatchValidator },
    ),
    plan: this.fb.group({
      planType: ['TRIAL' as PlanType, Validators.required],
    }),
    billing: this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiry: ['', [Validators.required, futureExpiryValidator]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    }),
  });

  readonly stepIndex = signal(0);
  readonly isLoading = signal(false);
  readonly isTermsOpen = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmation = signal(false);

  readonly availablePlans = signal<Plan[]>([]);
  readonly plansLoading = signal(false);
  readonly plansError = signal(false);

  private readonly errorKey = signal<keyof AuthText['register']['errors'] | null>(null);
  /** The backend's own 400 message, shown as is when it sends one. */
  private readonly serverMessage = signal<string | null>(null);
  readonly errorMessage = computed(() => {
    const key = this.errorKey();
    return this.serverMessage() ?? (key ? this.t().errors[key] : null);
  });

  // Form values as signals, for the step list and the scenes
  private readonly tenantName = toSignal(this.hotelForm.controls.tenantName.valueChanges, { initialValue: '' });
  private readonly email = toSignal(this.accountForm.controls.email.valueChanges, { initialValue: '' });
  private readonly password = toSignal(this.passwordForm.controls.password.valueChanges, { initialValue: '' });
  private readonly confirmPassword = toSignal(this.passwordForm.controls.confirmPassword.valueChanges, {
    initialValue: '',
  });
  private readonly planType = toSignal(this.planForm.controls.planType.valueChanges, {
    initialValue: 'TRIAL' as PlanType,
  });
  private readonly cardNumber = toSignal(this.billingForm.controls.cardNumber.valueChanges, { initialValue: '' });
  private readonly expiry = toSignal(this.billingForm.controls.expiry.valueChanges, { initialValue: '' });

  readonly selectedPlan = computed<Plan | null>(
    () => this.availablePlans().find((p) => p.type === this.planType()) ?? null,
  );
  readonly isTrialSelected = computed(() => {
    const plan = this.selectedPlan();
    return plan ? isFreePlan(plan) : this.planType() === 'TRIAL';
  });

  /** The card step only exists for paid plans. */
  readonly steps = computed<RegisterStep[]>(() => {
    const base: RegisterStep[] = ['hotel', 'email', 'password', 'plan'];
    return this.isTrialSelected() ? base : [...base, 'billing'];
  });
  readonly step = computed(() => this.steps()[Math.min(this.stepIndex(), this.steps().length - 1)]);
  readonly isLastStep = computed(() => this.stepIndex() >= this.steps().length - 1);

  readonly strength = computed(() => passwordStrength(this.password() ?? ''));
  readonly strengthWord = computed(() => {
    const s = this.strength();
    return s ? this.t().strength[String(s) as keyof AuthText['register']['strength']] : '';
  });
  readonly passwordsMatch = computed(
    () => (this.password() ?? '').length >= 8 && this.password() === this.confirmPassword(),
  );

  // Scene text
  readonly signText = computed(() => this.short(this.tenantName() ?? '', 22) || this.t().scene.yourHotel);
  readonly emailShown = computed(() => this.short(this.email() ?? '', 24) || this.t().scene.emailSample);
  readonly emailOk = computed(() => this.accountForm.controls.email.valid && !!this.email());
  readonly pwDots = computed(() => '•'.repeat(Math.min((this.password() ?? '').length, 14)));
  readonly pwLabel = computed(() => {
    const scene = this.t().scene;
    if (this.passwordsMatch()) return `${scene.pwMatch} · ${this.strengthWord()}`;
    if (this.confirmPassword() && this.confirmPassword() !== this.password()) return scene.pwMismatch;
    return this.strength() ? `${scene.security}: ${this.strengthWord()}` : scene.typePassword;
  });
  readonly meter = computed(() => {
    const score = this.strength();
    return [0, 1, 2, 3].map((n) => ({
      x: 186 + n * 38,
      fill: n < score ? (score >= 3 ? 'var(--brand-600)' : 'var(--brand-300)') : 'var(--line)',
    }));
  });
  readonly planBars = computed(() =>
    this.availablePlans()
      .slice(0, PLAN_BAR_HEIGHTS.length)
      .map((plan, n) => {
        const h = PLAN_BAR_HEIGHTS[n];
        const x = 120 + n * 74;
        return {
          type: plan.type,
          on: plan.type === this.planType(),
          x,
          y: 342 - h,
          h,
          cx: x + 28,
          ty: 342 - h - 10,
          name: plan.name.replace('LyHost ', ''),
          price: plan.price,
          delay: `${n * 0.08}s`,
        };
      }),
  );
  readonly cardShown = computed(() => {
    const last4 = (this.cardNumber() ?? '').slice(-4);
    return '•••• •••• •••• ' + (last4.length === 4 ? last4 : '••••');
  });
  readonly cardDisplay = computed(() => (this.cardNumber() ?? '').replace(/(\d{4})(?=\d)/g, '$1 '));
  readonly expShown = computed(() =>
    this.expiry() ? `${this.t().scene.expires} ${this.expiry()}` : this.t().expiryPlaceholder,
  );

  get hotelForm() {
    return this.form.controls.hotel;
  }
  get accountForm() {
    return this.form.controls.account;
  }
  get passwordForm() {
    return this.form.controls.password;
  }
  get planForm() {
    return this.form.controls.plan;
  }
  get billingForm() {
    return this.form.controls.billing;
  }

  /** Validate the current step, then go to the next one, or create the account on the last. */
  next(): void {
    if (this.isLoading()) return;
    const groups = {
      hotel: this.hotelForm,
      email: this.accountForm,
      password: this.passwordForm,
      plan: this.planForm,
      billing: this.billingForm,
    };
    const group = groups[this.step()];
    if (group.invalid) {
      group.markAllAsTouched();
      return;
    }
    if (this.step() === 'plan' && !this.selectedPlan()) return;

    if (this.isLastStep()) {
      this.submit();
      return;
    }
    this.stepIndex.update((i) => i + 1);
    if (this.step() === 'plan') this.loadPlans();
  }

  back(): void {
    this.stepIndex.update((i) => Math.max(0, i - 1));
  }

  /** Jump back to a finished step from the step dots. */
  goTo(index: number): void {
    if (index < this.stepIndex()) this.stepIndex.set(index);
  }

  loadPlans(): void {
    if (this.plansLoading() || this.availablePlans().length) return;
    this.plansLoading.set(true);
    this.plansError.set(false);

    this.getPlansUseCase.execute().subscribe({
      next: (plans) => {
        this.availablePlans.set(plans);
        this.plansLoading.set(false);
      },
      error: () => {
        this.plansLoading.set(false);
        this.plansError.set(true);
      },
    });
  }

  selectPlan(planType: PlanType): void {
    this.planForm.controls.planType.setValue(planType);
  }

  onCardNumberInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    this.billingForm.controls.cardNumber.setValue(raw);
  }

  onExpiryInput(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    this.billingForm.controls.expiry.setValue(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  }

  onCvvInput(event: Event): void {
    this.billingForm.controls.cvv.setValue((event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4));
  }

  private submit(): void {
    this.isLoading.set(true);
    this.errorKey.set(null);
    this.serverMessage.set(null);
    // ponytail: no payment provider yet, so a paid plan only waits 1.5 s like the previous page did
    if (this.isTrialSelected()) {
      this.register();
    } else {
      globalThis.setTimeout(() => this.register(), 1500);
    }
  }

  private register(): void {
    const tenantName = this.hotelForm.controls.tenantName.value!;
    const email = this.accountForm.controls.email.value!;
    const password = this.passwordForm.controls.password.value!;
    const planType = this.planForm.controls.planType.value!;

    this.registerUseCase.execute({ tenantName, email, password, planType }).subscribe({
      next: () => this.autoLogin(email, password),
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 409) {
          this.errorKey.set('emailTaken');
        } else if (err.status === 400) {
          this.errorKey.set('invalidData');
          this.serverMessage.set(err.error?.message ?? null);
        } else {
          this.errorKey.set('unexpected');
        }
      },
    });
  }

  private autoLogin(email: string, password: string): void {
    this.loginUseCase.execute({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/admin/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.tokenService.clear();
        this.userSessionService.clear();
        this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
      },
    });
  }

  private short(text: string, max: number): string {
    const value = text.trim();
    return value.length > max ? value.slice(0, max - 1) + '…' : value;
  }
}
