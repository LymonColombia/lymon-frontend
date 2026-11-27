import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RecoverPasswordComponent } from './recover-password';
import { RecoverPasswordUseCase } from '@/domain/tenant/auth/use-cases/recover-password.use-case';
import { TranslocoTestingModule } from '@jsverse/transloco';
import es from '@/presentation/tenant/features/auth/i18n/es.json';
import en from '@/presentation/tenant/features/auth/i18n/en.json';

const mockUseCase = { execute: vi.fn() };

async function setup(lang: 'es' | 'en' = 'es') {
  await TestBed.configureTestingModule({
    imports: [
      RecoverPasswordComponent,
      TranslocoTestingModule.forRoot({
        langs: { 'auth/es': es, 'auth/en': en },
        translocoConfig: { availableLangs: ['es', 'en'], defaultLang: lang },
        preloadLangs: true,
      }),
    ],
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

// ─── Cooldown de reenvío ─────────────────────────────────────────────────────
describe('RecoverPasswordComponent – cooldown de reenvío', () => {
  const RESEND_COOLDOWN_SECONDS = 30;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(of(undefined));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function submitted() {
    const ctx = await setup();
    vi.useFakeTimers();
    ctx.component.form.patchValue({ email: 'valid@example.com' });
    ctx.component.onSubmit();
    return ctx;
  }

  it('inicia el cooldown en 30 segundos tras el éxito', async () => {
    const { component } = await submitted();
    expect(component.wait()).toBe(RESEND_COOLDOWN_SECONDS);
  });

  it('descuenta un segundo por cada segundo transcurrido', async () => {
    const { component } = await submitted();
    vi.advanceTimersByTime(5000);
    expect(component.wait()).toBe(RESEND_COOLDOWN_SECONDS - 5);
  });

  it('llega a 0 y se detiene tras 30 segundos', async () => {
    const { component } = await submitted();
    vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000);
    expect(component.wait()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(component.wait()).toBe(0);
  });

  it('onResend no hace nada mientras wait() > 0', async () => {
    const { component } = await submitted();
    mockUseCase.execute.mockClear();
    component.onResend();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('onResend vuelve a llamar al use-case cuando wait() es 0', async () => {
    const { component } = await submitted();
    vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000);
    mockUseCase.execute.mockClear();
    component.onResend();
    expect(mockUseCase.execute).toHaveBeenCalledWith({ email: 'valid@example.com' });
    expect(component.wait()).toBe(RESEND_COOLDOWN_SECONDS);
  });

  it('onOtherEmail vuelve al formulario y reinicia el cooldown', async () => {
    const { component } = await submitted();
    component.onOtherEmail();
    expect(component.submitted()).toBe(false);
    expect(component.wait()).toBe(0);
    expect(component.errorMessage()).toBeNull();
  });

  it('onOtherEmail detiene el temporizador', async () => {
    const { component } = await submitted();
    component.onOtherEmail();
    vi.advanceTimersByTime(5000);
    expect(component.wait()).toBe(0);
  });
});

// ─── Email y otros casos ─────────────────────────────────────────────────────
describe('RecoverPasswordComponent – email e idioma', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUseCase.execute.mockReturnValue(of(undefined));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el error de email inválido en inglés', async () => {
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    const { component } = await setup('en');
    component.form.patchValue({ email: 'valid@example.com' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Invalid email. Check the field.');
  });
});
