import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ReactiveFormsModule,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapArrowLeft,
  bootstrapArrowRightCircleFill,
  bootstrapBuilding,
  bootstrapCalendar,
  bootstrapCheckCircleFill,
  bootstrapCreditCard,
  bootstrapEnvelope,
  bootstrapEye,
  bootstrapEyeSlash,
  bootstrapLock,
  bootstrapQuestionCircleFill,
} from '@ng-icons/bootstrap-icons';
import { RegisterUseCase } from '@/domain/use-cases/auth/register.use-case';
import { LoginUseCase } from '@/domain/use-cases/auth/login.use-case';
import { GetPlansUseCase } from '@/domain/use-cases/plan/get-plans.use-case';
import { TokenService } from '@/infrastructure/services/token.service';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { PlanType } from '@/domain/entities/auth.model';
import { LyhostPlan, isFreePlan } from '@/domain/entities/lyhost-plan.model';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { PasswordInputComponent } from '@/presentation/shared/components/password-input/password-input.component';
import { AuthTypeToggleComponent } from '@/presentation/shared/components/auth-type-toggle/auth-type-toggle.component';
import { minLocalPartLength } from '@/presentation/shared/validators/email.validator';

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

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIcon,
    ModalComponent,
    PasswordInputComponent,
    AuthTypeToggleComponent,
  ],
  providers: [
    provideIcons({
      bootstrapArrowLeft,
      bootstrapArrowRightCircleFill,
      bootstrapBuilding,
      bootstrapCalendar,
      bootstrapCheckCircleFill,
      bootstrapCreditCard,
      bootstrapEnvelope,
      bootstrapEye,
      bootstrapEyeSlash,
      bootstrapLock,
      bootstrapQuestionCircleFill,
    }),
  ],
  templateUrl: './register.html',
  styleUrls: ['../../../../../shared/styles/auth-form.css', './register.css'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registerUseCase = inject(RegisterUseCase);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly getPlansUseCase = inject(GetPlansUseCase);
  private readonly tokenService = inject(TokenService);
  private readonly userSessionService = inject(UserSessionService);
  private readonly router = inject(Router);

  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly isLoading = signal(false);
  readonly isProcessingPayment = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isTermsOpen = signal(false);
  readonly isConfirmModalOpen = signal(false);
  readonly showCvv = signal(false);

  readonly availablePlans = signal<LyhostPlan[]>([]);
  readonly plansLoading = signal(false);
  readonly plansError = signal<string | null>(null);

  readonly isTrialSelected = computed(() => {
    const plan = this.selectedPlan();
    return plan ? isFreePlan(plan) : false;
  });

  readonly visibleStepLabels = computed(() => {
    const base = ['Datos de tu hotel', 'Elegí tu plan'];
    return this.isTrialSelected() ? base : [...base, 'Pago'];
  });

  readonly form = this.fb.group({
    stepOne: this.fb.group(
      {
        tenantName: ['', Validators.required],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.maxLength(254),
            minLocalPartLength(8),
          ],
        ],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        terms: [false, Validators.requiredTrue],
      },
      { validators: passwordsMatchValidator },
    ),
    stepTwo: this.fb.group({
      planType: ['' as PlanType, Validators.required],
    }),
    stepThree: this.fb.group({
      cardName: ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiry: ['', [Validators.required, futureExpiryValidator]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    }),
  });

  readonly selectedPlanTypeSignal = signal<PlanType | null>(null);
  readonly cardNumberRaw = signal('');

  readonly selectedPlan = computed<LyhostPlan | null>(() => {
    const type = this.selectedPlanTypeSignal();
    if (!type) return null;
    return this.availablePlans().find((p) => p.type === type) ?? null;
  });

  readonly cardNumberDisplay = computed(() => {
    const value = this.cardNumberRaw();
    return value.replace(/(\d{4})(?=\d)/g, '$1 ');
  });

  readonly cardNumberConfirmMask = computed(() => {
    const value = this.cardNumberRaw();
    if (value.length < 4) return value;
    return `**** **** **** ${value.slice(-4)}`;
  });

  constructor() {
    this.stepTwoForm.controls.planType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.selectedPlanTypeSignal.set(value ?? null));

    this.stepThreeForm.controls.cardNumber.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.cardNumberRaw.set(value ?? ''));
  }

  get stepOneForm() {
    return this.form.controls.stepOne;
  }
  get stepTwoForm() {
    return this.form.controls.stepTwo;
  }
  get stepThreeForm() {
    return this.form.controls.stepThree;
  }

  get tenantNameControl() {
    return this.stepOneForm.controls.tenantName;
  }
  get emailControl() {
    return this.stepOneForm.controls.email;
  }
  get passwordControl() {
    return this.stepOneForm.controls.password;
  }
  get confirmPasswordControl() {
    return this.stepOneForm.controls.confirmPassword;
  }
  get termsControl() {
    return this.stepOneForm.controls.terms;
  }
  get planTypeControl() {
    return this.stepTwoForm.controls.planType;
  }
  get cardNameControl() {
    return this.stepThreeForm.controls.cardName;
  }
  get cardNumberControl() {
    return this.stepThreeForm.controls.cardNumber;
  }
  get expiryControl() {
    return this.stepThreeForm.controls.expiry;
  }
  get cvvControl() {
    return this.stepThreeForm.controls.cvv;
  }

  openTermsModal(): void {
    this.isTermsOpen.set(true);
  }

  closeTermsModal(): void {
    this.isTermsOpen.set(false);
  }

  openConfirmModal(): void {
    if (this.stepThreeForm.invalid) {
      this.stepThreeForm.markAllAsTouched();
      return;
    }
    this.isConfirmModalOpen.set(true);
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen.set(false);
  }

  goToStepTwo(): void {
    if (this.stepOneForm.invalid) {
      this.stepOneForm.markAllAsTouched();
      return;
    }

    this.currentStep.set(2);
    this.loadPlans();
  }

  goToStepThree(): void {
    if (this.stepTwoForm.invalid) {
      this.stepTwoForm.markAllAsTouched();
      return;
    }

    this.currentStep.set(3);
  }

  goBackToStepOne(): void {
    this.currentStep.set(1);
  }

  goBackToStepTwo(): void {
    this.currentStep.set(2);
  }

  loadPlans(): void {
    if (this.plansLoading()) return;

    this.plansLoading.set(true);
    this.plansError.set(null);

    this.getPlansUseCase.execute().subscribe({
      next: (plans) => {
        this.availablePlans.set(plans);
        this.plansLoading.set(false);
      },
      error: () => {
        this.plansLoading.set(false);
        this.plansError.set('No se pudieron cargar los planes. Intentá de nuevo.');
      },
    });
  }

  selectPlan(planType: PlanType): void {
    this.planTypeControl.setValue(planType);
    this.selectedPlanTypeSignal.set(planType);
  }

  onCardNumberInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value.replace(/\D/g, '').slice(0, 16);
    this.cardNumberRaw.set(raw);
    this.cardNumberControl.setValue(raw);
    this.cardNumberControl.markAsTouched();
  }

  onExpiryInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const digits = target.value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    this.expiryControl.setValue(formatted);
    this.expiryControl.markAsTouched();
  }

  onCvvInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value.replace(/\D/g, '').slice(0, 4);
    this.cvvControl.setValue(raw);
  }

  toggleCvvVisibility(): void {
    this.showCvv.update((v) => !v);
  }

  onTrialRegister(): void {
    this.isProcessingPayment.set(true);
    this.errorMessage.set(null);
    this.submitRegistration();
  }

  onFinalRegister(): void {
    this.isProcessingPayment.set(true);
    this.errorMessage.set(null);

    globalThis.setTimeout(() => {
      this.submitRegistration();
    }, 1500);
  }

  private submitRegistration(): void {
    const stepOne = this.stepOneForm.getRawValue();
    const stepTwo = this.stepTwoForm.getRawValue();

    const payload = {
      tenantName: stepOne.tenantName!,
      email: stepOne.email!,
      password: stepOne.password!,
      planType: stepTwo.planType!,
    };

    this.isLoading.set(true);

    this.registerUseCase.execute(payload).subscribe({
      next: () => {
        this.autoLogin(stepOne.email!, stepOne.password!);
      },
      error: (err: HttpErrorResponse) => {
        this.isProcessingPayment.set(false);
        this.isLoading.set(false);
        this.isConfirmModalOpen.set(false);
        if (err.status === 409) {
          this.errorMessage.set('Ya existe una cuenta con este correo.');
        } else if (err.status === 400) {
          this.errorMessage.set(err.error?.message ?? 'Datos inválidos. Verifica los campos.');
        } else {
          this.errorMessage.set('Ocurrió un error inesperado. Inténtalo de nuevo.');
        }
      },
    });
  }

  private autoLogin(email: string, password: string): void {
    this.loginUseCase.execute({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isProcessingPayment.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.isProcessingPayment.set(false);
        this.tokenService.clear();
        this.userSessionService.clear();
        this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
      },
    });
  }
}
