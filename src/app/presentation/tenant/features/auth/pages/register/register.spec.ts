import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { RegisterComponent } from './register';
import { RegisterUseCase } from '@/domain/tenant/auth/use-cases/register.use-case';
import { LoginUseCase } from '@/domain/tenant/auth/use-cases/login.use-case';
import { GetPlansUseCase } from '@/domain/shared/plan/use-cases/get-plans.use-case';
import { PLANS } from '@/domain/shared/plan/plan.model';
import { TokenService } from '@/infrastructure/tenant/services/token.service';
import { UserSessionService } from '@/infrastructure/tenant/services/user-session.service';
import es from '@/presentation/tenant/features/auth/i18n/es.json';
import en from '@/presentation/tenant/features/auth/i18n/en.json';

const mockRegister = { execute: vi.fn() };
const mockLogin = { execute: vi.fn() };
const mockGetPlans = { execute: vi.fn() };
const mockTokenService = { clear: vi.fn() };
const mockUserSession = { clear: vi.fn() };

const HOTEL = 'Hotel Aurora';
const EMAIL = 'owner@aurora.com';
const PASSWORD = 'Password1';
const VALID_CARD = '4111111111111111';
const VALID_EXPIRY = '12/99'; // far in the future
const PAST_EXPIRY = '01/20';
const VALID_CVV = '123';
const PAID_DELAY_MS = 1500;

async function setup(lang: 'es' | 'en' = 'es') {
  await TestBed.configureTestingModule({
    imports: [
      RegisterComponent,
      TranslocoTestingModule.forRoot({
        langs: { 'auth/es': es, 'auth/en': en },
        translocoConfig: { availableLangs: ['es', 'en'], defaultLang: lang },
        preloadLangs: true,
      }),
    ],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      { provide: RegisterUseCase, useValue: mockRegister },
      { provide: LoginUseCase, useValue: mockLogin },
      { provide: GetPlansUseCase, useValue: mockGetPlans },
      { provide: TokenService, useValue: mockTokenService },
      { provide: UserSessionService, useValue: mockUserSession },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(RegisterComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  const router = TestBed.inject(Router);
  const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  return { fixture, component, router, navigateSpy };
}

type Component = RegisterComponent;

function fillHotel(c: Component) {
  c.hotelForm.patchValue({ tenantName: HOTEL });
}
function fillEmail(c: Component) {
  c.accountForm.patchValue({ email: EMAIL });
}
function fillPassword(c: Component) {
  c.passwordForm.patchValue({ password: PASSWORD, confirmPassword: PASSWORD, terms: true });
}
/** Fills and advances through hotel, email and password, landing on the plan step. */
function goToPlanStep(c: Component) {
  fillHotel(c);
  c.next();
  fillEmail(c);
  c.next();
  fillPassword(c);
  c.next();
}
function fillBilling(c: Component) {
  c.billingForm.patchValue({ cardNumber: VALID_CARD, expiry: VALID_EXPIRY, cvv: VALID_CVV });
}
function inputEvent(value: string): Event {
  return { target: { value } } as unknown as Event;
}

beforeEach(() => {
  vi.clearAllMocks();
  TestBed.resetTestingModule();
  mockGetPlans.execute.mockReturnValue(of(PLANS));
  mockRegister.execute.mockReturnValue(of({}));
  mockLogin.execute.mockReturnValue(of({}));
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Steps ───────────────────────────────────────────────────────────────────
describe('RegisterComponent – steps', () => {
  it('should start on the hotel step', async () => {
    const { component } = await setup();
    expect(component.step()).toBe('hotel');
    expect(component.stepIndex()).toBe(0);
  });

  it('should not advance and should mark the step touched when the hotel name is empty', async () => {
    const { component } = await setup();
    component.next();
    expect(component.step()).toBe('hotel');
    expect(component.hotelForm.controls.tenantName.touched).toBe(true);
  });

  it('should not advance from the email step when the email is malformed', async () => {
    const { component } = await setup();
    fillHotel(component);
    component.next();
    component.accountForm.patchValue({ email: 'not-an-email' });
    component.next();
    expect(component.step()).toBe('email');
    expect(component.accountForm.controls.email.touched).toBe(true);
  });

  it('should not advance from the password step when the password is too short', async () => {
    const { component } = await setup();
    fillHotel(component);
    component.next();
    fillEmail(component);
    component.next();
    component.passwordForm.patchValue({ password: 'short', confirmPassword: 'short', terms: true });
    component.next();
    expect(component.step()).toBe('password');
    expect(component.passwordForm.controls.password.touched).toBe(true);
  });

  it('should not advance from the password step when the passwords do not match', async () => {
    const { component } = await setup();
    fillHotel(component);
    component.next();
    fillEmail(component);
    component.next();
    component.passwordForm.patchValue({ password: PASSWORD, confirmPassword: 'Different1', terms: true });
    component.next();
    expect(component.step()).toBe('password');
    expect(component.passwordForm.hasError('passwordsMismatch')).toBe(true);
  });

  it('should not advance from the password step when the terms are not accepted', async () => {
    const { component } = await setup();
    fillHotel(component);
    component.next();
    fillEmail(component);
    component.next();
    component.passwordForm.patchValue({ password: PASSWORD, confirmPassword: PASSWORD, terms: false });
    component.next();
    expect(component.step()).toBe('password');
    expect(component.passwordForm.controls.terms.touched).toBe(true);
  });

  it('should advance hotel, email, password and plan when each step is valid', async () => {
    const { component } = await setup();
    const visited = [component.step()];
    fillHotel(component);
    component.next();
    visited.push(component.step());
    fillEmail(component);
    component.next();
    visited.push(component.step());
    fillPassword(component);
    component.next();
    visited.push(component.step());
    expect(visited).toEqual(['hotel', 'email', 'password', 'plan']);
  });

  it('should load plans once when entering the plan step and not again when coming back', async () => {
    const { component } = await setup();
    goToPlanStep(component);
    expect(mockGetPlans.execute).toHaveBeenCalledTimes(1);
    expect(component.availablePlans()).toEqual(PLANS);

    component.back();
    component.next();
    expect(component.step()).toBe('plan');
    expect(mockGetPlans.execute).toHaveBeenCalledTimes(1);
  });

  it('should set plansError when loading plans fails and retry on loadPlans()', async () => {
    mockGetPlans.execute.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    const { component } = await setup();
    goToPlanStep(component);
    expect(component.plansError()).toBe(true);
    expect(component.plansLoading()).toBe(false);
    expect(component.availablePlans()).toEqual([]);

    component.loadPlans();
    expect(mockGetPlans.execute).toHaveBeenCalledTimes(2);
    expect(component.plansError()).toBe(false);
    expect(component.availablePlans()).toEqual(PLANS);
  });

  it('should not request plans again while a load is in flight', async () => {
    const pending = new Subject<typeof PLANS>();
    mockGetPlans.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    goToPlanStep(component);
    expect(component.plansLoading()).toBe(true);
    component.loadPlans();
    expect(mockGetPlans.execute).toHaveBeenCalledTimes(1);
  });

  it('should not advance from the plan step while the selected plan is not loaded', async () => {
    mockGetPlans.execute.mockReturnValue(new Subject().asObservable());
    const { component } = await setup();
    goToPlanStep(component);
    component.next();
    expect(mockRegister.execute).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });
});

// ─── steps() list ────────────────────────────────────────────────────────────
describe('RegisterComponent – steps list', () => {
  it('should have 4 steps for the default TRIAL plan', async () => {
    const { component } = await setup();
    expect(component.steps()).toEqual(['hotel', 'email', 'password', 'plan']);
  });

  it('should have 5 steps ending with billing for a paid plan', async () => {
    const { component } = await setup();
    component.selectPlan('PLUS');
    expect(component.steps()).toHaveLength(5);
    expect(component.steps().at(-1)).toBe('billing');
  });

  it('should remove billing when switching back to TRIAL', async () => {
    const { component } = await setup();
    component.selectPlan('PLUS');
    component.selectPlan('TRIAL');
    expect(component.steps()).toHaveLength(4);
    expect(component.steps()).not.toContain('billing');
  });
});

// ─── back() and goTo() ───────────────────────────────────────────────────────
describe('RegisterComponent – back and goTo', () => {
  it('should keep entered values when going back', async () => {
    const { component } = await setup();
    fillHotel(component);
    component.next();
    fillEmail(component);
    component.next();
    component.back();
    expect(component.step()).toBe('email');
    expect(component.accountForm.controls.email.value).toBe(EMAIL);
    component.back();
    expect(component.hotelForm.controls.tenantName.value).toBe(HOTEL);
  });

  it('should not go below the first step', async () => {
    const { component } = await setup();
    component.back();
    expect(component.stepIndex()).toBe(0);
  });

  it('should jump to an earlier step with goTo and keep the values', async () => {
    const { component } = await setup();
    goToPlanStep(component);
    component.goTo(0);
    expect(component.step()).toBe('hotel');
    expect(component.hotelForm.controls.tenantName.value).toBe(HOTEL);
    expect(component.passwordForm.controls.password.value).toBe(PASSWORD);
  });

  it('should ignore goTo to the current or a later step', async () => {
    const { component } = await setup();
    fillHotel(component);
    component.next();
    component.goTo(1);
    expect(component.stepIndex()).toBe(1);
    component.goTo(3);
    expect(component.stepIndex()).toBe(1);
  });
});

// ─── Trial ───────────────────────────────────────────────────────────────────
describe('RegisterComponent – trial registration', () => {
  it('should register immediately with TRIAL and no card data on the plan step', async () => {
    const { component } = await setup();
    goToPlanStep(component);
    component.next();
    expect(mockRegister.execute).toHaveBeenCalledTimes(1);
    expect(mockRegister.execute).toHaveBeenCalledWith({
      tenantName: HOTEL,
      email: EMAIL,
      password: PASSWORD,
      planType: 'TRIAL',
    });
  });

  it('should have isLoading true while the register request is pending', async () => {
    mockRegister.execute.mockReturnValue(new Subject().asObservable());
    const { component } = await setup();
    goToPlanStep(component);
    component.next();
    expect(component.isLoading()).toBe(true);
  });

  it('should ignore next() while loading', async () => {
    mockRegister.execute.mockReturnValue(new Subject().asObservable());
    const { component } = await setup();
    goToPlanStep(component);
    component.next();
    component.next();
    expect(mockRegister.execute).toHaveBeenCalledTimes(1);
  });
});

// ─── Paid plan ───────────────────────────────────────────────────────────────
describe('RegisterComponent – paid registration', () => {
  async function toBillingStep() {
    const ctx = await setup();
    goToPlanStep(ctx.component);
    ctx.component.selectPlan('PLUS');
    ctx.component.next();
    return ctx;
  }

  it('should move to the billing step after choosing a paid plan', async () => {
    const { component } = await toBillingStep();
    expect(component.step()).toBe('billing');
    expect(component.isLastStep()).toBe(true);
  });

  it('should block when the card number is invalid', async () => {
    vi.useFakeTimers();
    const { component } = await toBillingStep();
    component.billingForm.patchValue({ cardNumber: '1234', expiry: VALID_EXPIRY, cvv: VALID_CVV });
    component.next();
    vi.advanceTimersByTime(PAID_DELAY_MS);
    expect(component.isLoading()).toBe(false);
    expect(component.billingForm.controls.cardNumber.touched).toBe(true);
    expect(mockRegister.execute).not.toHaveBeenCalled();
  });

  it('should block when the expiry is invalid', async () => {
    vi.useFakeTimers();
    const { component } = await toBillingStep();
    component.billingForm.patchValue({ cardNumber: VALID_CARD, expiry: '13/99', cvv: VALID_CVV });
    component.next();
    vi.advanceTimersByTime(PAID_DELAY_MS);
    expect(component.billingForm.controls.expiry.hasError('expiryInvalid')).toBe(true);
    expect(mockRegister.execute).not.toHaveBeenCalled();
  });

  it('should block when the cvv is invalid', async () => {
    vi.useFakeTimers();
    const { component } = await toBillingStep();
    component.billingForm.patchValue({ cardNumber: VALID_CARD, expiry: VALID_EXPIRY, cvv: '12' });
    component.next();
    vi.advanceTimersByTime(PAID_DELAY_MS);
    expect(component.billingForm.controls.cvv.invalid).toBe(true);
    expect(mockRegister.execute).not.toHaveBeenCalled();
  });

  it('should strip non-digits from the card number input', async () => {
    const { component } = await setup();
    component.onCardNumberInput(inputEvent('4111-1111 abcd 1111 1111 99'));
    expect(component.billingForm.controls.cardNumber.value).toBe(VALID_CARD);
  });

  it('should format the expiry input as MM/YY', async () => {
    const { component } = await setup();
    component.onExpiryInput(inputEvent('0830'));
    expect(component.billingForm.controls.expiry.value).toBe('08/30');
  });

  it('should keep a short expiry input without the slash', async () => {
    const { component } = await setup();
    component.onExpiryInput(inputEvent('0a8'));
    expect(component.billingForm.controls.expiry.value).toBe('08');
  });

  it('should strip non-digits from the cvv input', async () => {
    const { component } = await setup();
    component.onCvvInput(inputEvent('1a2b3'));
    expect(component.billingForm.controls.cvv.value).toBe(VALID_CVV);
  });

  it('should flag a past expiry as expiryPast', async () => {
    const { component } = await setup();
    component.onExpiryInput(inputEvent(PAST_EXPIRY.replace('/', '')));
    expect(component.billingForm.controls.expiry.hasError('expiryPast')).toBe(true);
  });

  it('should wait 1500 ms before registering with PLUS and no card data', async () => {
    vi.useFakeTimers();
    const { component } = await toBillingStep();
    fillBilling(component);
    component.next();

    expect(component.isLoading()).toBe(true);
    vi.advanceTimersByTime(PAID_DELAY_MS - 1);
    expect(mockRegister.execute).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockRegister.execute).toHaveBeenCalledTimes(1);
    expect(mockRegister.execute).toHaveBeenCalledWith({
      tenantName: HOTEL,
      email: EMAIL,
      password: PASSWORD,
      planType: 'PLUS',
    });
  });
});

// ─── After register ──────────────────────────────────────────────────────────
describe('RegisterComponent – after register', () => {
  it('should navigate to the dashboard when the auto login succeeds', async () => {
    const { component, navigateSpy } = await setup();
    goToPlanStep(component);
    component.next();
    expect(mockLogin.execute).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD });
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
    expect(component.isLoading()).toBe(false);
  });

  it('should clear the session and go to login when the auto login fails', async () => {
    mockLogin.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const { component, navigateSpy } = await setup();
    goToPlanStep(component);
    component.next();
    expect(mockTokenService.clear).toHaveBeenCalledTimes(1);
    expect(mockUserSession.clear).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { registered: 'true' } });
    expect(component.isLoading()).toBe(false);
  });
});

// ─── Errors ──────────────────────────────────────────────────────────────────
describe('RegisterComponent – register errors', () => {
  async function submitWith(error: HttpErrorResponse, lang: 'es' | 'en' = 'es') {
    mockRegister.execute.mockReturnValue(throwError(() => error));
    const ctx = await setup(lang);
    goToPlanStep(ctx.component);
    ctx.component.next();
    return ctx;
  }

  it.each([
    ['409', new HttpErrorResponse({ status: 409 }), 'Ya existe una cuenta con este correo.'],
    [
      '400 with a backend message',
      new HttpErrorResponse({ status: 400, error: { message: 'El nombre del hotel ya existe' } }),
      'El nombre del hotel ya existe',
    ],
    ['400 without a backend message', new HttpErrorResponse({ status: 400 }), 'Datos inválidos. Verifica los campos.'],
    ['other statuses', new HttpErrorResponse({ status: 500 }), 'Ocurrió un error inesperado. Inténtalo de nuevo.'],
  ])('should show the right message on %s', async (_case, error, expected) => {
    const { component } = await submitWith(error);
    expect(component.errorMessage()).toBe(expected);
    expect(component.isLoading()).toBe(false);
  });

  it('should not auto login when register fails', async () => {
    await submitWith(new HttpErrorResponse({ status: 500 }));
    expect(mockLogin.execute).not.toHaveBeenCalled();
  });

  it('should clear a previous error when submitting again', async () => {
    mockRegister.execute.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    const { component } = await setup();
    goToPlanStep(component);
    component.next();
    expect(component.errorMessage()).not.toBeNull();
    component.next();
    expect(component.errorMessage()).toBeNull();
  });

  it('should translate the 409 message to English', async () => {
    const { component } = await submitWith(new HttpErrorResponse({ status: 409 }), 'en');
    expect(component.errorMessage()).toBe('An account with this email already exists.');
  });
});

// ─── Scene helpers ───────────────────────────────────────────────────────────
describe('RegisterComponent – scene helpers', () => {
  it('should fall back to "Tu hotel" when the hotel name is empty', async () => {
    const { component } = await setup();
    expect(component.signText()).toBe('Tu hotel');
  });

  it('should show the hotel name in the sign', async () => {
    const { component } = await setup();
    fillHotel(component);
    expect(component.signText()).toBe(HOTEL);
  });

  it('should truncate long hotel names with an ellipsis', async () => {
    const { component } = await setup();
    component.hotelForm.patchValue({ tenantName: 'A'.repeat(40) });
    expect(component.signText()).toBe('A'.repeat(21) + '…');
  });

  it('should report passwordsMatch only for equal passwords of at least 8 characters', async () => {
    const { component } = await setup();
    expect(component.passwordsMatch()).toBe(false);

    component.passwordForm.patchValue({ password: 'short', confirmPassword: 'short' });
    expect(component.passwordsMatch()).toBe(false);

    component.passwordForm.patchValue({ password: PASSWORD, confirmPassword: 'Other1234' });
    expect(component.passwordsMatch()).toBe(false);

    component.passwordForm.patchValue({ password: PASSWORD, confirmPassword: PASSWORD });
    expect(component.passwordsMatch()).toBe(true);
  });

  it('should show the last 4 digits of the card number', async () => {
    const { component } = await setup();
    component.onCardNumberInput(inputEvent(VALID_CARD.slice(0, 12) + '9876'));
    expect(component.cardShown()).toBe('•••• •••• •••• 9876');
  });

  it('should mask the card until 4 digits are available', async () => {
    const { component } = await setup();
    expect(component.cardShown()).toBe('•••• •••• •••• ••••');
    component.onCardNumberInput(inputEvent('41'));
    expect(component.cardShown()).toBe('•••• •••• •••• ••••');
  });
});
