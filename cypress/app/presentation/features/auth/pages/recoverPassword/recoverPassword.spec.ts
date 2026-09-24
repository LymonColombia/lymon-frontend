import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RecoverPasswordComponent } from './recoverPassword';
import { RecoverPasswordUseCase } from '@/domain/use-cases/auth/recover-password.use-case';

const mockUseCase = { execute: vi.fn() };

async function setup() {
  await TestBed.configureTestingModule({
    imports: [RecoverPasswordComponent],
    providers: [provideRouter([]), { provide: RecoverPasswordUseCase, useValue: mockUseCase }],
  }).compileComponents();

  const fixture = TestBed.createComponent(RecoverPasswordComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component };
}

// ─── Formulario inválido ─────────────────────────────────────────────────────
describe('RecoverPasswordComponent – formulario inválido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('no llama al use-case si el email está vacío', async () => {
    const { component } = await setup();
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('marca todos los campos como tocados si el formulario es inválido', async () => {
    const { component } = await setup();
    const spy = vi.spyOn(component.form, 'markAllAsTouched');
    component.onSubmit();
    expect(spy).toHaveBeenCalled();
  });

  it('no llama al use-case si el email no tiene formato válido', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'no-es-un-email' });
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });
});

// ─── Carga en curso ──────────────────────────────────────────────────────────
describe('RecoverPasswordComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<void>();
    mockUseCase.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    component.form.patchValue({ email: 'valid@example.com' });
    component.onSubmit();
    expect(component.isLoading()).toBe(true);
  });
});

// ─── Éxito ────────────────────────────────────────────────────────────────────
describe('RecoverPasswordComponent – envío exitoso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(of(undefined));
  });

  it('submitted se establece en true tras el éxito', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'valid@example.com' });
    component.onSubmit();
    expect(component.submitted()).toBe(true);
  });

  it('isLoading vuelve a false tras el éxito', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'valid@example.com' });
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });

  it('no hay mensaje de error tras el éxito', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'valid@example.com' });
    component.onSubmit();
    expect(component.errorMessage()).toBeNull();
  });
});

// ─── Error 400 ────────────────────────────────────────────────────────────────
describe('RecoverPasswordComponent – error 400', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
  });

  it('muestra mensaje de correo inválido', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'valid@example.com' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Correo inválido. Verifica los campos.');
  });

  it('isLoading vuelve a false tras el error 400', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'valid@example.com' });
    component.onSubmit();
    expect(component.isLoading()).toBe(false);
  });
});

// ─── Error inesperado ─────────────────────────────────────────────────────────
describe('RecoverPasswordComponent – error inesperado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
  });

  it('muestra mensaje de error inesperado', async () => {
    const { component } = await setup();
    component.form.patchValue({ email: 'valid@example.com' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
