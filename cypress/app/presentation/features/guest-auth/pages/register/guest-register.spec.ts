import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { GuestRegisterComponent } from './guest-register';
import { GuestRegisterUseCase } from '@/domain/use-cases/guest/guest-register.use-case';

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_FORM = {
  fullName: 'Felipe Torres',
  email: 'felipe@example.com',
  password: 'secret1234',
  firstName: '',
  lastName: '',
};

const SUCCESS_RESPONSE = {
  message: 'Registration successful',
  data: { guestAccountId: 'abc-123', email: 'felipe@example.com' },
};

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/guest/register' });
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('GuestRegisterComponent — US-021', () => {
  let fixture: ComponentFixture<GuestRegisterComponent>;
  let component: GuestRegisterComponent;
  let executeMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    executeMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [GuestRegisterComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: GuestRegisterUseCase, useValue: { execute: executeMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Camino 1,2,3,12 — Validación cliente falla ────────────────────────────

  describe('Validación de formulario falla', () => {
    it('no llama al use-case si el formulario está vacío', () => {
      component.onSubmit();

      expect(executeMock).not.toHaveBeenCalled();
    });

    it('marca todos los campos como tocados al fallar la validación', () => {
      const spy = vi.spyOn(component.form, 'markAllAsTouched');

      component.onSubmit();

      expect(spy).toHaveBeenCalled();
    });

    it('mantiene isLoading en false cuando el formulario es inválido', () => {
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('fullName con menos de 2 caracteres hace el formulario inválido', () => {
      component.form.patchValue({ ...VALID_FORM, fullName: 'A' });

      expect(component.form.invalid).toBe(true);
    });

    it('email con formato incorrecto hace el formulario inválido', () => {
      component.form.patchValue({ ...VALID_FORM, email: 'no-es-un-email' });

      expect(component.form.invalid).toBe(true);
    });

    it('password con menos de 8 caracteres hace el formulario inválido', () => {
      component.form.patchValue({ ...VALID_FORM, password: '1234' });

      expect(component.form.invalid).toBe(true);
    });
  });

  // ── Camino 1,2,4,5,6,7,8,9,12 — Error en servidor ────────────────────────

  describe('Formulario válido, error en servidor', () => {
    beforeEach(() => {
      component.form.patchValue(VALID_FORM);
    });

    it('muestra mensaje de email duplicado ante error 409', () => {
      executeMock.mockReturnValue(throwError(() => httpError(409)));

      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Este correo ya está registrado. ¿Quieres iniciar sesión o recuperar tu contraseña?',
      );
    });

    it('muestra mensaje de validación ante error 400', () => {
      executeMock.mockReturnValue(throwError(() => httpError(400)));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Verifica los campos e inténtalo de nuevo.');
    });

    it('muestra mensaje genérico ante error inesperado (500)', () => {
      executeMock.mockReturnValue(throwError(() => httpError(500)));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
    });

    it('restablece isLoading a false tras cualquier error del servidor', () => {
      executeMock.mockReturnValue(throwError(() => httpError(409)));

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('no establece registeredEmail cuando hay un error', () => {
      executeMock.mockReturnValue(throwError(() => httpError(409)));

      component.onSubmit();

      expect(component.registeredEmail()).toBeNull();
    });

    it('activa isLoading mientras la petición está en curso', () => {
      // El observable nunca emite → isLoading permanece true durante la suscripción
      const pending$ = new Subject<never>();
      executeMock.mockReturnValue(pending$.asObservable());

      component.onSubmit();

      expect(component.isLoading()).toBe(true);
    });
  });

  // ── Camino 1,2,4,5,6,7,8,10,11,12 — Registro exitoso ────────────────────

  describe('Registro exitoso', () => {
    beforeEach(() => {
      component.form.patchValue(VALID_FORM);
      executeMock.mockReturnValue(of(SUCCESS_RESPONSE));
    });

    it('llama al use-case con los datos correctos del formulario', () => {
      component.onSubmit();

      expect(executeMock).toHaveBeenCalledWith({
        fullName: 'Felipe Torres',
        email: 'felipe@example.com',
        password: 'secret1234',
        firstName: undefined,
        lastName: undefined,
      });
      expect(executeMock).toHaveBeenCalledTimes(1);
    });

    it('establece registeredEmail con el email retornado por el servidor', () => {
      component.onSubmit();

      expect(component.registeredEmail()).toBe('felipe@example.com');
    });

    it('restablece isLoading a false tras el éxito', () => {
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('no establece errorMessage en caso de éxito', () => {
      component.onSubmit();

      expect(component.errorMessage()).toBeNull();
    });

    it('envía firstName y lastName cuando se proporcionan', () => {
      component.form.patchValue({ firstName: 'Felipe', lastName: 'Torres' });

      component.onSubmit();

      const payload = executeMock.mock.calls[0][0];
      expect(payload.firstName).toBe('Felipe');
      expect(payload.lastName).toBe('Torres');
    });

    it('omite firstName y lastName cuando están vacíos', () => {
      component.onSubmit();

      const payload = executeMock.mock.calls[0][0];
      expect(payload.firstName).toBeUndefined();
      expect(payload.lastName).toBeUndefined();
    });
  });
});
