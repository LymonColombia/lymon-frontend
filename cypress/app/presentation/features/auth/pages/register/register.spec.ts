import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterComponent } from './register';
import { RegisterUseCase } from '@/domain/use-cases/auth/register.use-case';

const mockUseCase = { execute: vi.fn() };

const VALID_FORM = {
  tenantName: 'Hotel Lymon',
  email: 'admin@hotel.com',
  password: 'Password1',
  confirmPassword: 'Password1',
  planType: 'TRIAL' as const,
  terms: true,
};

async function setup() {
  await TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [provideRouter([]), { provide: RegisterUseCase, useValue: mockUseCase }],
  }).compileComponents();

  const fixture = TestBed.createComponent(RegisterComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  const router = TestBed.inject(Router);
  return { fixture, component, router };
}

// ─── Formulario inválido ─────────────────────────────────────────────────────
describe('RegisterComponent – formulario inválido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('no llama al use-case si los campos están vacíos', async () => {
    const { component } = await setup();
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('marca todos los campos como tocados', async () => {
    const { component } = await setup();
    const spy = vi.spyOn(component.form, 'markAllAsTouched');
    component.onSubmit();
    expect(spy).toHaveBeenCalled();
  });

  it('no llama al use-case si los términos no están aceptados', async () => {
    const { component } = await setup();
    component.form.patchValue({ ...VALID_FORM, terms: false });
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('no llama al use-case si las contraseñas no coinciden', async () => {
    const { component } = await setup();
    component.form.patchValue({ ...VALID_FORM, confirmPassword: 'OtherPass1' });
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('no llama al use-case si el nombre es menor a 3 caracteres', async () => {
    const { component } = await setup();
    component.form.patchValue({ ...VALID_FORM, tenantName: 'AB' });
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });
});

// ─── Carga en curso ──────────────────────────────────────────────────────────
describe('RegisterComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<void>();
    mockUseCase.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    component.form.patchValue(VALID_FORM);
    component.onSubmit();
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Registro exitoso ─────────────────────────────────────────────────────────
describe('RegisterComponent – registro exitoso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(of(undefined));
  });

  it('navega a /booking tras el éxito', async () => {
    const { component, router } = await setup();
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.form.patchValue(VALID_FORM);
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/booking']);
  });

  it('isLoading vuelve a false tras el éxito', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM);
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });

  it('no muestra mensaje de error tras el éxito', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM);
    component.onSubmit();
    expect(component.errorMessage()).toBeNull();
  });
});

// ─── Error 409 (correo duplicado) ─────────────────────────────────────────────
describe('RegisterComponent – error 409 (correo duplicado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
  });

  it('muestra mensaje de cuenta existente', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM);
    component.onSubmit();
    expect(component.errorMessage()).toBe('Ya existe una cuenta con este correo.');
  });

  it('isLoading vuelve a false', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM);
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });
});

// ─── Error 400 ────────────────────────────────────────────────────────────────
describe('RegisterComponent – error 400 (datos inválidos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
  });

  it('muestra mensaje de datos inválidos', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM);
    component.onSubmit();
    expect(component.errorMessage()).toBe('Datos inválidos. Verifica los campos.');
  });
});

// ─── Error inesperado ─────────────────────────────────────────────────────────
describe('RegisterComponent – error inesperado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
  });

  it('muestra mensaje de error inesperado', async () => {
    const { component } = await setup();
    component.form.patchValue(VALID_FORM);
    component.onSubmit();
    expect(component.errorMessage()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
