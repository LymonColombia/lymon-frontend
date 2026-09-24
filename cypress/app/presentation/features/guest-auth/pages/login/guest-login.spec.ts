import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { GuestLoginComponent } from './guest-login';
import { GuestLoginUseCase } from '@/domain/use-cases/guest/guest-login.use-case';
import { GuestLoginResponse } from '@/domain/entities/guest-auth.model';

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_CREDENTIALS = {
  email: 'felipe@example.com',
  password: 'secret1234',
};

function loginResponse(emailVerified: boolean): GuestLoginResponse {
  return {
    guestAccountId: 'abc-123',
    email: 'felipe@example.com',
    emailVerified,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };
}

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/guest/login' });
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('GuestLoginComponent — US-022', () => {
  let fixture: ComponentFixture<GuestLoginComponent>;
  let component: GuestLoginComponent;
  let executeMock: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(async () => {
    executeMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [GuestLoginComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: GuestLoginUseCase, useValue: { execute: executeMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestLoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // ── Formulario inválido ───────────────────────────────────────────────────

  describe('Formulario inválido: no se envía al servidor', () => {
    it('no llama al use-case si el formulario está vacío', () => {
      component.onSubmit();

      expect(executeMock).not.toHaveBeenCalled();
    });

    it('marca todos los campos como tocados al fallar la validación', () => {
      const spy = vi.spyOn(component.form, 'markAllAsTouched');

      component.onSubmit();

      expect(spy).toHaveBeenCalled();
    });

    it('mantiene isLoading en false con formulario inválido', () => {
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('email con formato incorrecto hace el formulario inválido', () => {
      component.form.patchValue({ email: 'no-es-un-email', password: 'secret1234' });

      expect(component.form.invalid).toBe(true);
    });

    it('password con menos de 8 caracteres hace el formulario inválido', () => {
      component.form.patchValue({ email: 'felipe@example.com', password: '1234' });

      expect(component.form.invalid).toBe(true);
    });
  });

  // ── Credenciales incorrectas (401) ────────────────────────────────────────

  describe('Credenciales incorrectas: backend rechaza con 401', () => {
    beforeEach(() => {
      component.form.patchValue(VALID_CREDENTIALS);
      executeMock.mockReturnValue(throwError(() => httpError(401)));
    });

    it('muestra mensaje de credenciales incorrectas', () => {
      component.onSubmit();

      expect(component.errorMessage()).toBe('Correo o contraseña incorrectos.');
    });

    it('restablece isLoading a false tras el error 401', () => {
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('no navega cuando las credenciales son incorrectas', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.onSubmit();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('muestra mensaje de datos inválidos ante error 400', () => {
      executeMock.mockReturnValue(throwError(() => httpError(400)));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Datos inválidos. Verifica los campos.');
    });

    it('muestra mensaje genérico ante error inesperado (500)', () => {
      executeMock.mockReturnValue(throwError(() => httpError(500)));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
    });
  });

  // ── Login exitoso — email NO verificado ───────────────────────────────────

  describe('Login exitoso con email no verificado', () => {
    beforeEach(() => {
      component.form.patchValue(VALID_CREDENTIALS);
      executeMock.mockReturnValue(of(loginResponse(false)));
    });

    it('activa la advertencia emailNotVerified', () => {
      component.onSubmit();

      expect(component.emailNotVerified()).toBe(true);
    });

    it('restablece isLoading a false', () => {
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('no establece errorMessage', () => {
      component.onSubmit();

      expect(component.errorMessage()).toBeNull();
    });

    it('navega a /guest/dashboard aunque el email no esté verificado', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.onSubmit();

      expect(navigateSpy).toHaveBeenCalledWith(['/guest/dashboard']);
    });

    it('llama al use-case con las credenciales correctas', () => {
      component.onSubmit();

      expect(executeMock).toHaveBeenCalledWith({
        email: 'felipe@example.com',
        password: 'secret1234',
      });
    });
  });

  // ── Login exitoso — email verificado ──────────────────────────────────────

  describe('Login exitoso con email verificado', () => {
    beforeEach(() => {
      component.form.patchValue(VALID_CREDENTIALS);
      executeMock.mockReturnValue(of(loginResponse(true)));
    });

    it('no activa emailNotVerified', () => {
      component.onSubmit();

      expect(component.emailNotVerified()).toBe(false);
    });

    it('restablece isLoading a false', () => {
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('no establece errorMessage', () => {
      component.onSubmit();

      expect(component.errorMessage()).toBeNull();
    });

    it('navega a /guest/dashboard', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.onSubmit();

      expect(navigateSpy).toHaveBeenCalledWith(['/guest/dashboard']);
    });
  });
});
