import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginComponent } from './login';
import { LoginUseCase } from '@/domain/use-cases/auth/login.use-case';

const mockUseCase = { execute: vi.fn() };

async function setup() {
  await TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [provideRouter([]), { provide: LoginUseCase, useValue: mockUseCase }],
  }).compileComponents();

  const fixture = TestBed.createComponent(LoginComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  const router = TestBed.inject(Router);
  return { fixture, component, router };
}

// ─── Formulario inválido ─────────────────────────────────────────────────────
describe('LoginComponent – formulario inválido', () => {
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

  it('no llama al use-case si la contraseña es demasiado corta', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'admin@lymon.com', password: 'short' });
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });
});

// ─── Carga en curso ──────────────────────────────────────────────────────────
describe('LoginComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<void>();
    mockUseCase.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Inicio de sesión exitoso ─────────────────────────────────────────────────
describe('LoginComponent – inicio de sesión exitoso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(of(undefined));
  });

  it('navega a /booking tras el éxito', async () => {
    const { component, router } = await setup();
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/booking']);
  });

  it('isLoading vuelve a false tras el éxito', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });

  it('no muestra mensaje de error tras el éxito', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(component.errorMessage()).toBeNull();
  });
});

// ─── Error 401 ────────────────────────────────────────────────────────────────
describe('LoginComponent – error 401 (credenciales incorrectas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
  });

  it('muestra mensaje de credenciales incorrectas', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Correo o contraseña incorrectos.');
  });

  it('isLoading vuelve a false tras el error 401', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });
});

// ─── Error 400 ────────────────────────────────────────────────────────────────
describe('LoginComponent – error 400 (datos inválidos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
  });

  it('muestra mensaje de datos inválidos', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Datos inválidos. Verifica los campos.');
  });
});

// ─── Error inesperado ─────────────────────────────────────────────────────────
describe('LoginComponent – error inesperado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
  });

  it('muestra mensaje de error inesperado', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
