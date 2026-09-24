import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { GuestVerifyEmailComponent } from './verify-email';
import { GuestVerifyEmailUseCase } from '@/domain/use-cases/guest/guest-verify-email.use-case';

// ─── Helpers ────────────────────────────────────────────────────────────────

function activatedRouteStub(token: string | null) {
  return {
    snapshot: {
      queryParamMap: {
        get: (key: string) => (key === 'token' ? token : null),
      },
    },
  };
}

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/guest/verify-email' });
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('GuestVerifyEmailComponent — US-023', () => {
  let fixture: ComponentFixture<GuestVerifyEmailComponent>;
  let component: GuestVerifyEmailComponent;
  let executeMock: ReturnType<typeof vi.fn>;

  async function setup(token: string | null) {
    executeMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [GuestVerifyEmailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub(token) },
        { provide: GuestVerifyEmailUseCase, useValue: { execute: executeMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestVerifyEmailComponent);
    component = fixture.componentInstance;
  }

  // ── Token no presente en URL ──────────────────────────────────────────────

  describe('Token no presente en URL', () => {
    beforeEach(async () => {
      await setup(null);
      fixture.detectChanges(); // dispara ngOnInit
    });

    it('establece status en error', () => {
      expect(component.status()).toBe('error');
    });

    it('muestra mensaje de token ausente', () => {
      expect(component.errorMessage()).toBe('No se encontró un token de verificación.');
    });

    it('no llama al use-case', () => {
      expect(executeMock).not.toHaveBeenCalled();
    });
  });

  // ── Token inválido o expirado (401) ───────────────────────────────────────

  describe('Token inválido o expirado', () => {
    beforeEach(async () => {
      await setup('invalid-token');
      executeMock.mockReturnValue(throwError(() => httpError(401)));
      fixture.detectChanges();
    });

    it('establece status en error', () => {
      expect(component.status()).toBe('error');
    });

    it('muestra mensaje de token inválido o expirado', () => {
      expect(component.errorMessage()).toBe(
        'El enlace de verificación es inválido o ha expirado.',
      );
    });

    it('llama al use-case con el token de la URL', () => {
      expect(executeMock).toHaveBeenCalledWith('invalid-token');
    });

  });

  // ── Token inválido — error genérico (no 401) ─────────────────────────────

  describe('Token con error genérico del servidor (500)', () => {
    beforeEach(async () => {
      await setup('otro-token');
      executeMock.mockReturnValue(throwError(() => httpError(500)));
      fixture.detectChanges();
    });

    it('muestra mensaje genérico ante error distinto de 401', () => {
      expect(component.errorMessage()).toBe(
        'No se pudo verificar tu correo. Inténtalo de nuevo.',
      );
    });

    it('establece status en error', () => {
      expect(component.status()).toBe('error');
    });
  });

  // ── Token válido — email ya verificado ───────────────────────────────────

  describe('Token válido pero email ya verificado', () => {
    beforeEach(async () => {
      await setup('valid-token');
      executeMock.mockReturnValue(of({ message: 'Email already verified' }));
      fixture.detectChanges();
    });

    it('establece status en already-verified', () => {
      expect(component.status()).toBe('already-verified');
    });

    it('no establece errorMessage', () => {
      expect(component.errorMessage()).toBeNull();
    });

    it('llama al use-case con el token correcto', () => {
      expect(executeMock).toHaveBeenCalledWith('valid-token');
    });
  });

  // ── Token válido — email verificado exitosamente ──────────────────────────

  describe('Token válido y email sin verificar', () => {
    beforeEach(async () => {
      await setup('valid-token');
      executeMock.mockReturnValue(of({ message: 'Email verified successfully' }));
      fixture.detectChanges();
    });

    it('establece status en success', () => {
      expect(component.status()).toBe('success');
    });

    it('no establece errorMessage', () => {
      expect(component.errorMessage()).toBeNull();
    });

    it('llama al use-case con el token correcto', () => {
      expect(executeMock).toHaveBeenCalledWith('valid-token');
    });
  });

  // ── Estado loading mientras la petición está en curso ────────────────────

  describe('Estado loading mientras la petición está pendiente', () => {
    beforeEach(async () => {
      await setup('valid-token');
      const pending$ = new Subject<never>();
      executeMock.mockReturnValue(pending$.asObservable());
      fixture.detectChanges(); // dispara ngOnInit, pending$ nunca emite
    });

    it('mantiene status en loading mientras la petición está en curso', () => {
      expect(component.status()).toBe('loading');
    });
  });
});
