import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginComponent } from './login';
import { LoginUseCase } from '@/domain/tenant/auth/use-cases/login.use-case';
import { TutorialService } from '@/presentation/tenant/services/tutorial.service';
import { TranslocoTestingModule } from '@jsverse/transloco';
import es from '@/presentation/tenant/features/auth/i18n/es.json';
import en from '@/presentation/tenant/features/auth/i18n/en.json';

const mockUseCase = { execute: vi.fn() };
const mockTutorialService = { start: vi.fn() };

async function setup(lang: 'es' | 'en' = 'es') {
  await TestBed.configureTestingModule({
    imports: [
      LoginComponent,
      TranslocoTestingModule.forRoot({
        langs: { 'auth/es': es, 'auth/en': en },
        translocoConfig: { availableLangs: ['es', 'en'], defaultLang: lang },
        preloadLangs: true,
      }),
    ],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      { provide: LoginUseCase, useValue: mockUseCase },
      { provide: TutorialService, useValue: mockTutorialService },
    ],
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
    mockUseCase.execute.mockReturnValue(of({ user: { tutorialCompleted: true } }));
  });

  it('navega a /dashboard tras el éxito', async () => {
    const { component, router } = await setup();
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('inicia el tutorial en vez de navegar si no lo ha completado', async () => {
    mockUseCase.execute.mockReturnValue(of({ user: { tutorialCompleted: false } }));
    const { component, router } = await setup();
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(mockTutorialService.start).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
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

// ─── Mostrar/ocultar contraseña ───────────────────────────────────────────────
describe('LoginComponent – mostrar/ocultar contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('oculta la contraseña por defecto con aria-label "Mostrar contraseña"', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    const input = el.querySelector<HTMLInputElement>('#login-password')!;
    const eye = el.querySelector<HTMLButtonElement>('.eye')!;
    expect(input.type).toBe('password');
    expect(eye.getAttribute('aria-label')).toBe('Mostrar contraseña');
  });

  it('muestra la contraseña y cambia el aria-label al pulsar el botón', async () => {
    const { fixture, component } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector<HTMLButtonElement>('.eye')!.click();
    fixture.detectChanges();
    expect(component.showPassword()).toBe(true);
    expect(el.querySelector<HTMLInputElement>('#login-password')!.type).toBe('text');
    expect(el.querySelector('.eye')!.getAttribute('aria-label')).toBe('Ocultar contraseña');
  });

  it('vuelve a ocultar la contraseña al pulsar el botón dos veces', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    const eye = el.querySelector<HTMLButtonElement>('.eye')!;
    eye.click();
    fixture.detectChanges();
    eye.click();
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('#login-password')!.type).toBe('password');
    expect(eye.getAttribute('aria-label')).toBe('Mostrar contraseña');
  });
});

// ─── Idioma ──────────────────────────────────────────────────────────────────
describe('LoginComponent – idioma', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('muestra el texto en inglés cuando el idioma activo es inglés', async () => {
    const { fixture } = await setup('en');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button[type="submit"]')!.textContent!.trim()).toBe('Log in');
    expect(el.querySelector('label[for="login-email"]')!.textContent!.trim()).toBe('Email');
  });

  it('traduce los errores del servidor al idioma activo', async () => {
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const { component } = await setup('en');
    component.form.patchValue({ email: 'admin@lymon.com', password: 'Password1' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Wrong email or password.');
  });

  it('el inglés tiene exactamente las mismas claves que el español', () => {
    const keys = (o: object, path = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object' ? keys(v, `${path}${k}.`) : [`${path}${k}`],
      );
    expect(keys(en)).toEqual(keys(es));
  });
});
