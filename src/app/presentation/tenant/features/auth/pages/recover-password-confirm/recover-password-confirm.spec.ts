import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmRecoverPasswordComponent, passwordStrength } from './recover-password-confirm';
import { ConfirmRecoverPasswordUseCase } from '@/domain/tenant/auth/use-cases/confirm-recover-password.use-case';
import { TranslocoTestingModule } from '@jsverse/transloco';
import es from '@/presentation/tenant/features/auth/i18n/es.json';
import en from '@/presentation/tenant/features/auth/i18n/en.json';

const mockUseCase = { execute: vi.fn() };
const TOKEN = 'reset-token-123';
const VALID_PASSWORD = 'Abcdefg1!';

async function setup(token: string | null = TOKEN, lang: 'es' | 'en' = 'es') {
  await TestBed.configureTestingModule({
    imports: [
      ConfirmRecoverPasswordComponent,
      TranslocoTestingModule.forRoot({
        langs: { 'auth/es': es, 'auth/en': en },
        translocoConfig: { availableLangs: ['es', 'en'], defaultLang: lang },
        preloadLangs: true,
      }),
    ],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      { provide: ConfirmRecoverPasswordUseCase, useValue: mockUseCase },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: { get: () => token } } },
      },
    ],
  }).compileComponents();

  const router = TestBed.inject(Router);
  const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(ConfirmRecoverPasswordComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component, navigateSpy };
}

function fillForm(component: ConfirmRecoverPasswordComponent, pw = VALID_PASSWORD, confirmation = pw) {
  component.form.patchValue({ newPassword: pw, newPasswordConfirmation: confirmation });
}

describe('ConfirmRecoverPasswordComponent – token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('redirige a /recover-password si no hay token', async () => {
    const { navigateSpy, component } = await setup(null);
    expect(navigateSpy).toHaveBeenCalledWith(['/recover-password']);
    expect(component.token()).toBeNull();
  });

  it('guarda el token y no redirige si existe', async () => {
    const { navigateSpy, component } = await setup();
    expect(component.token()).toBe(TOKEN);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

describe('ConfirmRecoverPasswordComponent – formulario inválido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('no llama al use-case con el formulario vacío y marca los campos como tocados', async () => {
    const { component } = await setup();
    const spy = vi.spyOn(component.form, 'markAllAsTouched');
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('no llama al use-case si la contraseña es demasiado corta', async () => {
    const { component } = await setup();
    fillForm(component, 'Ab1!');
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('no llama al use-case si las contraseñas no coinciden', async () => {
    const { component } = await setup();
    fillForm(component, VALID_PASSWORD, 'Different1!');
    component.onSubmit();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('passwordsMismatch es true solo con confirmación tocada, rellena y distinta', async () => {
    const { component } = await setup();
    fillForm(component, VALID_PASSWORD, 'Different1!');
    expect(component.passwordsMismatch).toBe(false);
    component.newPasswordConfirmationControl.markAsTouched();
    expect(component.passwordsMismatch).toBe(true);
  });
});

describe('ConfirmRecoverPasswordComponent – envío', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isLoading es true mientras el observable no emite', async () => {
    mockUseCase.execute.mockReturnValue(new Subject<void>().asObservable());
    const { component } = await setup();
    fillForm(component);
    component.onSubmit();
    expect(component.isLoading()).toBe(true);
  });

  it('llama al use-case con token y contraseñas', async () => {
    mockUseCase.execute.mockReturnValue(of(undefined));
    const { component } = await setup();
    fillForm(component);
    component.onSubmit();
    expect(mockUseCase.execute).toHaveBeenCalledWith({
      token: TOKEN,
      newPassword: VALID_PASSWORD,
      newPasswordConfirmation: VALID_PASSWORD,
    });
  });

  it('done pasa a true tras el éxito, isLoading a false y no navega', async () => {
    mockUseCase.execute.mockReturnValue(of(undefined));
    const { component, navigateSpy } = await setup();
    fillForm(component);
    component.onSubmit();
    expect(component.done()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('muestra enlace inválido ante error 400', async () => {
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    const { component } = await setup();
    fillForm(component);
    component.onSubmit();
    expect(component.errorMessage()).toBe('El enlace es inválido o ha expirado.');
    expect(component.isLoading()).toBe(false);
    expect(component.done()).toBe(false);
  });

  it('muestra error inesperado ante otros errores', async () => {
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const { component } = await setup();
    fillForm(component);
    component.onSubmit();
    expect(component.errorMessage()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
    expect(component.isLoading()).toBe(false);
  });

  it('limpia el error previo al reintentar', async () => {
    mockUseCase.execute.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    const { component } = await setup();
    fillForm(component);
    component.onSubmit();
    mockUseCase.execute.mockReturnValueOnce(new Subject<void>().asObservable());
    component.onSubmit();
    expect(component.errorMessage()).toBeNull();
  });

  it('muestra el error en inglés cuando el idioma es en', async () => {
    mockUseCase.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    const { component } = await setup(TOKEN, 'en');
    fillForm(component);
    component.onSubmit();
    expect(component.errorMessage()).toBe(en.reset.errors.invalidLink);
  });
});

describe('passwordStrength()', () => {
  it.each([
    ['', 0],
    ['abc', 1], // nothing scores, floored to 1
    ['abcdefgh', 1], // length only
    ['abcdefg1', 2], // length + digit
    ['Abcdefg1', 3], // + mixed case
    ['Abcdefg1!', 4], // + symbol
    ['abcdefghijkl', 2], // length + 12 chars
  ])('devuelve la puntuación esperada para "%s"', (pw, expected) => {
    expect(passwordStrength(pw)).toBe(expected);
  });
});

describe('ConfirmRecoverPasswordComponent – strengthWord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('es vacío con la contraseña vacía', async () => {
    const { component } = await setup();
    expect(component.strength()).toBe(0);
    expect(component.strengthWord()).toBe('');
  });

  it.each([
    ['abc', 'Seguridad débil'],
    ['abcdefg1', 'Seguridad aceptable'],
    ['Abcdefg1', 'Seguridad fuerte'],
    ['Abcdefg1!', 'Seguridad muy fuerte'],
  ])('refleja la puntuación de "%s"', async (pw, word) => {
    const { component } = await setup();
    component.form.controls.newPassword.setValue(pw);
    expect(component.strengthWord()).toBe(word);
  });
});
