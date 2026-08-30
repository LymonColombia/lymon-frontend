import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterComponent } from './register';
import { RegisterUseCase } from '@/domain/tenant/auth/use-cases/register.use-case';
import { LoginUseCase } from '@/domain/tenant/auth/use-cases/login.use-case';
import { GetPlansUseCase } from '@/domain/use-cases/plan/get-plans.use-case';
import { PLANS } from '@/domain/entities/plan.model';
import { TokenService } from '@/infrastructure/services/token.service';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockRegisterUseCase = { execute: vi.fn() };
const mockLoginUseCase = { execute: vi.fn() };
const mockGetPlansUseCase = { execute: vi.fn() };
const mockTokenService = { clear: vi.fn(), store: vi.fn() };
const mockUserSessionService = { clear: vi.fn(), setUser: vi.fn(), currentUser: vi.fn() };

const VALID_STEP_ONE = {
  tenantName: 'Hotel Lymon',
  email: 'administrador@hotel.com',
  password: 'Password1',
  confirmPassword: 'Password1',
  terms: true,
};

const VALID_PAYMENT = {
  cardName: 'Juan Pérez',
  cardNumber: '4111111111111111',
  expiry: '12/30',
  cvv: '123',
};

async function setup() {
  await TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [
      provideRouter([]),
      { provide: RegisterUseCase, useValue: mockRegisterUseCase },
      { provide: LoginUseCase, useValue: mockLoginUseCase },
      { provide: GetPlansUseCase, useValue: mockGetPlansUseCase },
      { provide: TokenService, useValue: mockTokenService },
      { provide: UserSessionService, useValue: mockUserSessionService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(RegisterComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  const router = TestBed.inject(Router);
  return { fixture, component, router };
}

describe('RegisterComponent – paso 1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlansUseCase.execute.mockReturnValue(of([...PLANS]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicia en el paso 1', async () => {
    const { component } = await setup();
    expect(component.currentStep()).toBe(1);
  });

  it('no avanza si el paso 1 es inválido y marca campos tocados', async () => {
    const { component } = await setup();
    const spy = vi.spyOn(component.stepOneForm, 'markAllAsTouched');
    component.goToStepTwo();
    expect(spy).toHaveBeenCalled();
    expect(component.currentStep()).toBe(1);
  });

  it('no avanza si las contraseñas no coinciden', async () => {
    const { component } = await setup();
    component.stepOneForm.patchValue({
      ...VALID_STEP_ONE,
      confirmPassword: 'OtraPass1',
    });
    component.goToStepTwo();
    expect(component.currentStep()).toBe(1);
  });

  it('no avanza si los términos no están aceptados', async () => {
    const { component } = await setup();
    component.stepOneForm.patchValue({ ...VALID_STEP_ONE, terms: false });
    component.goToStepTwo();
    expect(component.currentStep()).toBe(1);
  });

  it('valida longitud mínima de la parte local del correo', async () => {
    const { component } = await setup();
    component.stepOneForm.patchValue({ ...VALID_STEP_ONE, email: 'a@b.com' });
    expect(component.emailControl.hasError('minLocalPartLength')).toBe(true);
  });

  it('avanza al paso 2 cuando el paso 1 es válido y carga planes', async () => {
    const { component } = await setup();
    component.stepOneForm.patchValue(VALID_STEP_ONE);
    component.goToStepTwo();
    expect(component.currentStep()).toBe(2);
    expect(mockGetPlansUseCase.execute).toHaveBeenCalled();
  });
});

describe('RegisterComponent – paso 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlansUseCase.execute.mockReturnValue(of([...PLANS]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function reachStepTwo(component: RegisterComponent) {
    component.stepOneForm.patchValue(VALID_STEP_ONE);
    component.goToStepTwo();
  }

  it('muestra error si la carga de planes falla y permite reintentar', async () => {
    mockGetPlansUseCase.execute.mockReturnValue(throwError(() => new Error('fail')));
    const { component } = await setup();
    await reachStepTwo(component);
    expect(component.plansError()).toBeTruthy();

    mockGetPlansUseCase.execute.mockReturnValue(of([...PLANS]));
    component.loadPlans();
    expect(component.plansError()).toBeNull();
    expect(component.availablePlans().length).toBeGreaterThan(0);
  });

  it('no avanza al paso 3 sin plan seleccionado', async () => {
    const { component } = await setup();
    await reachStepTwo(component);
    component.goToStepThree();
    expect(component.currentStep()).toBe(2);
  });

  it('avanza al paso 3 tras seleccionar un plan', async () => {
    const { component } = await setup();
    await reachStepTwo(component);
    component.selectPlan('PLUS');
    component.goToStepThree();
    expect(component.currentStep()).toBe(3);
  });

  it('volver atrás conserva los datos del paso 1', async () => {
    const { component } = await setup();
    await reachStepTwo(component);
    component.goBackToStepOne();
    expect(component.currentStep()).toBe(1);
    expect(component.stepOneForm.value.email).toBe(VALID_STEP_ONE.email);
  });

  it('detecta plan trial como gratuito y oculta paso 3', async () => {
    const { component } = await setup();
    await reachStepTwo(component);
    component.selectPlan('TRIAL');
    expect(component.isTrialSelected()).toBe(true);
    expect(component.visibleStepLabels()).toHaveLength(2);
  });

  it('registra directamente al elegir trial sin pasar por pago', async () => {
    mockRegisterUseCase.execute.mockReturnValue(of({ message: 'ok', user: {}, tokens: {} }));
    mockLoginUseCase.execute.mockReturnValue(of({ user: {}, tokens: {} }));
    const { component, router } = await setup();
    await reachStepTwo(component);
    component.selectPlan('TRIAL');
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onTrialRegister();

    expect(mockRegisterUseCase.execute).toHaveBeenCalledWith({
      tenantName: VALID_STEP_ONE.tenantName,
      email: VALID_STEP_ONE.email,
      password: VALID_STEP_ONE.password,
      planType: 'TRIAL',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('vuelve a 3 pasos si se cambia de trial a plan de pago', async () => {
    const { component } = await setup();
    await reachStepTwo(component);
    component.selectPlan('TRIAL');
    expect(component.visibleStepLabels()).toHaveLength(2);
    component.selectPlan('PLUS');
    expect(component.isTrialSelected()).toBe(false);
    expect(component.visibleStepLabels()).toHaveLength(3);
  });
});

describe('RegisterComponent – paso 3 y registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlansUseCase.execute.mockReturnValue(of([...PLANS]));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function reachStepThree(component: RegisterComponent) {
    component.stepOneForm.patchValue(VALID_STEP_ONE);
    component.goToStepTwo();
    component.selectPlan('PLUS');
    component.goToStepThree();
  }

  it('no abre el modal si los datos de pago son inválidos', async () => {
    const { component } = await setup();
    await reachStepThree(component);
    const spy = vi.spyOn(component.stepThreeForm, 'markAllAsTouched');
    component.openConfirmModal();
    expect(spy).toHaveBeenCalled();
    expect(component.isConfirmModalOpen()).toBe(false);
    expect(mockRegisterUseCase.execute).not.toHaveBeenCalled();
  });

  it('abre modal de confirmación con datos de tarjeta', async () => {
    const { component } = await setup();
    await reachStepThree(component);
    component.stepThreeForm.patchValue(VALID_PAYMENT);

    component.openConfirmModal();

    expect(component.isConfirmModalOpen()).toBe(true);
    expect(component.cardNumberConfirmMask()).toContain('1111');
  });

  it('muestra "Procesando…" durante el delay simulado tras confirmar', async () => {
    const { component } = await setup();
    await reachStepThree(component);
    component.stepThreeForm.patchValue(VALID_PAYMENT);
    mockRegisterUseCase.execute.mockReturnValue(new Subject().asObservable());

    component.openConfirmModal();
    component.onFinalRegister();
    expect(component.isProcessingPayment()).toBe(true);
  });

  it('registra con los datos del paso 1 y plan, sin datos de tarjeta', async () => {
    const { component } = await setup();
    await reachStepThree(component);
    component.stepThreeForm.patchValue(VALID_PAYMENT);
    mockRegisterUseCase.execute.mockReturnValue(of({ message: 'ok', user: {}, tokens: {} }));
    mockLoginUseCase.execute.mockReturnValue(of({ user: {}, tokens: {} }));

    component.openConfirmModal();
    component.onFinalRegister();
    vi.advanceTimersByTime(1500);

    expect(mockRegisterUseCase.execute).toHaveBeenCalledWith({
      tenantName: VALID_STEP_ONE.tenantName,
      email: VALID_STEP_ONE.email,
      password: VALID_STEP_ONE.password,
      planType: 'PLUS',
    });
  });

  it('auto-login exitoso redirige al dashboard', async () => {
    const { component, router } = await setup();
    await reachStepThree(component);
    component.stepThreeForm.patchValue(VALID_PAYMENT);
    mockRegisterUseCase.execute.mockReturnValue(of({ message: 'ok', user: {}, tokens: {} }));
    mockLoginUseCase.execute.mockReturnValue(of({ user: {}, tokens: {} }));
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.openConfirmModal();
    component.onFinalRegister();
    vi.advanceTimersByTime(1500);

    expect(mockLoginUseCase.execute).toHaveBeenCalledWith({
      email: VALID_STEP_ONE.email,
      password: VALID_STEP_ONE.password,
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('auto-login fallido redirige al login con mensaje de cuenta creada', async () => {
    const { component, router } = await setup();
    await reachStepThree(component);
    component.stepThreeForm.patchValue(VALID_PAYMENT);
    mockRegisterUseCase.execute.mockReturnValue(of({ message: 'ok', user: {}, tokens: {} }));
    mockLoginUseCase.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.openConfirmModal();
    component.onFinalRegister();
    vi.advanceTimersByTime(1500);

    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { registered: 'true' },
    });
  });

  it('muestra mensaje de error si el registro falla', async () => {
    const { component } = await setup();
    await reachStepThree(component);
    component.stepThreeForm.patchValue(VALID_PAYMENT);
    mockRegisterUseCase.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );

    component.openConfirmModal();
    component.onFinalRegister();
    vi.advanceTimersByTime(1500);

    expect(component.errorMessage()).toBe('Ya existe una cuenta con este correo.');
    expect(component.isProcessingPayment()).toBe(false);
  });
});
