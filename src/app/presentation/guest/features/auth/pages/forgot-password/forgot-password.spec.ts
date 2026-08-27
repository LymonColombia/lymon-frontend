import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { GuestForgotPasswordComponent } from './forgot-password';
import { GuestRecoverPasswordUseCase } from '@/domain/use-cases/guest/guest-recover-password.use-case';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/guest/recover-password' });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('GuestForgotPasswordComponent — US-024', () => {
  let fixture: ComponentFixture<GuestForgotPasswordComponent>;
  let component: GuestForgotPasswordComponent;
  let executeMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    executeMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [GuestForgotPasswordComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: GuestRecoverPasswordUseCase, useValue: { execute: executeMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Email inválido o vacío ────────────────────────────────────────────────

  describe('Email inválido o vacío: no se envía al servidor', () => {
    it('no llama al use-case si el formulario está vacío', () => {
      component.onSubmit();

      expect(executeMock).not.toHaveBeenCalled();
    });

    it('marca el campo email como tocado al fallar la validación', () => {
      const spy = vi.spyOn(component.form, 'markAllAsTouched');

      component.onSubmit();

      expect(spy).toHaveBeenCalled();
    });

    it('mantiene isLoading en false con formulario inválido', () => {
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('mantiene submitted en false con formulario inválido', () => {
      component.onSubmit();

      expect(component.submitted()).toBe(false);
    });

    it('email con formato incorrecto hace el formulario inválido', () => {
      component.form.patchValue({ email: 'no-es-un-email' });

      expect(component.form.invalid).toBe(true);
    });

    it('el campo email vacío hace el formulario inválido', () => {
      component.form.patchValue({ email: '' });

      expect(component.form.invalid).toBe(true);
    });
  });

  // ── Email válido — respuesta genérica (anti-enumeración) ─────────────────

  describe('Email válido: respuesta genérica independiente del resultado', () => {
    beforeEach(() => {
      component.form.patchValue({ email: 'felipe@example.com' });
    });

    it('activa submitted tras respuesta exitosa del servidor', () => {
      executeMock.mockReturnValue(of({ message: 'Recovery email sent' }));

      component.onSubmit();

      expect(component.submitted()).toBe(true);
    });

    it('restablece isLoading a false tras respuesta exitosa', () => {
      executeMock.mockReturnValue(of({ message: 'Recovery email sent' }));

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('activa submitted aunque el email no esté registrado (404)', () => {
      executeMock.mockReturnValue(throwError(() => httpError(404)));

      component.onSubmit();

      expect(component.submitted()).toBe(true);
    });

    it('activa submitted ante cualquier otro error del servidor (500)', () => {
      executeMock.mockReturnValue(throwError(() => httpError(500)));

      component.onSubmit();

      expect(component.submitted()).toBe(true);
    });

    it('restablece isLoading a false tanto en éxito como en error', () => {
      executeMock.mockReturnValue(throwError(() => httpError(404)));

      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });

    it('llama al use-case con el email introducido', () => {
      executeMock.mockReturnValue(of({ message: 'Recovery email sent' }));

      component.onSubmit();

      expect(executeMock).toHaveBeenCalledWith({ email: 'felipe@example.com' });
    });

    it('activa isLoading mientras la petición está en curso', () => {
      const pending$ = new Subject<never>();
      executeMock.mockReturnValue(pending$.asObservable());

      component.onSubmit();

      expect(component.isLoading()).toBe(true);
    });

    it('no revela si el email existe o no: submitted es true en ambos casos', () => {
      // Caso A: email registrado (200)
      executeMock.mockReturnValue(of({ message: 'Recovery email sent' }));
      component.onSubmit();
      const submittedOnSuccess = component.submitted();

      // Reset
      component.submitted.set(false);

      // Caso B: email no registrado (404)
      executeMock.mockReturnValue(throwError(() => httpError(404)));
      component.onSubmit();
      const submittedOnNotFound = component.submitted();

      expect(submittedOnSuccess).toBe(true);
      expect(submittedOnNotFound).toBe(true);
    });
  });
});
