import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { TenantProfileComponent } from './tenantProfile';
import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { UpdateTenantProfileUseCase } from '@/domain/use-cases/tenant/update-tenant-profile.use-case';
import { TenantProfile } from '@/domain/entities/tenant.model';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const MOCK_TENANT_PROFILE: TenantProfile = {
  name: 'Hotel Paradise',
  contactPhone: '+52 55 1234 5678',
  address: 'Av. Reforma 123',
  website: 'https://www.hotel.com',
  logoUrl: 'https://storage.com/logo.png',
};

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/tenant/profile' });
}

// ─── Suite ─────────────────────────────────────────────────────────────────

describe('TenantProfileComponent — Obtener y Editar Perfil del Negocio', () => {
  let fixture: ComponentFixture<TenantProfileComponent>;
  let component: TenantProfileComponent;
  let getTenantProfileMock: ReturnType<typeof vi.fn>;
  let updateTenantProfileMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getTenantProfileMock = vi.fn().mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));
    updateTenantProfileMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [TenantProfileComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: GetTenantProfileUseCase, useValue: { execute: getTenantProfileMock } },
        { provide: UpdateTenantProfileUseCase, useValue: { execute: updateTenantProfileMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantProfileComponent);
    component = fixture.componentInstance;
  });

  // ─── GET: Cargar perfil del tenant ──────────────────────────────────────

  describe('GET /tenant/profile — Cargar datos actuales', () => {
    it('debe cargar el perfil exitosamente al inicializar', () => {
      getTenantProfileMock.mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));

      fixture.detectChanges();

      expect(component.isLoadingProfile()).toBe(false);
      expect(component.nameControl.value).toBe('Hotel Paradise');
      expect(component.contactPhoneControl.value).toBe('+52 55 1234 5678');
    });

    it('debe rellenar campos nulos como strings vacíos', () => {
      const profileWithNulls: TenantProfile = {
        name: 'Hotel Test',
        contactPhone: null,
        address: null,
        website: null,
        logoUrl: null,
      };

      getTenantProfileMock.mockReturnValue(of({ data: profileWithNulls }));
      fixture.detectChanges();

      expect(component.contactPhoneControl.value).toBe('');
      expect(component.addressControl.value).toBe('');
    });

    it('debe mostrar error al fallar la carga', () => {
      getTenantProfileMock.mockReturnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();

      expect(component.isLoadingProfile()).toBe(false);
      expect(component.errorMessage()).toBe('No se pudo cargar el perfil. Inténtalo de nuevo.');
    });

    it('debe mantener loading en true mientras carga', () => {
      getTenantProfileMock.mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));

      expect(component.isLoadingProfile()).toBe(true);
      fixture.detectChanges();
      expect(component.isLoadingProfile()).toBe(false);
    });

    it('llama al use-case exactamente una vez al inicializar', () => {
      fixture.detectChanges();

      expect(getTenantProfileMock).toHaveBeenCalledTimes(1);
    });
  });

  // ─── PATCH: Actualizar perfil del tenant ────────────────────────────────

  describe('PATCH /tenant/profile — Actualizar datos', () => {
    beforeEach(() => {
      getTenantProfileMock.mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));
      fixture.detectChanges();
    });

    it('debe actualizar el perfil exitosamente', () => {
      updateTenantProfileMock.mockReturnValue(
        of({ message: 'success', data: MOCK_TENANT_PROFILE }),
      );

      component.form.patchValue({
        name: 'Hotel Nuevo',
        contactPhone: '+52 55 9876 5432',
      });
      component.onSubmit();

      expect(component.isSubmitting()).toBe(false);
      expect(component.successMessage()).toBe('Perfil actualizado exitosamente.');
    });

    it('debe mostrar error 400 (datos inválidos)', () => {
      updateTenantProfileMock.mockReturnValue(throwError(() => httpError(400)));

      component.form.patchValue({ name: 'Test' });
      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Datos inválidos. Verifica los campos e intenta de nuevo.',
      );
    });

    it('debe mostrar error 403 (sin permiso)', () => {
      updateTenantProfileMock.mockReturnValue(throwError(() => httpError(403)));

      component.form.patchValue({ name: 'Test' });
      component.onSubmit();

      expect(component.errorMessage()).toBe('No tienes permiso para editar el perfil.');
    });

    it('debe mostrar error genérico para otros estatus', () => {
      updateTenantProfileMock.mockReturnValue(throwError(() => httpError(500)));

      component.form.patchValue({ name: 'Test' });
      component.onSubmit();

      expect(component.errorMessage()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
    });

    it('no debe enviar si el formulario es inválido', () => {
      component.form.patchValue({ name: '' });
      component.form.markAllAsTouched();

      component.onSubmit();

      expect(updateTenantProfileMock).not.toHaveBeenCalled();
    });

    it('debe limpiar mensajes antes de ejecutar', () => {
      updateTenantProfileMock.mockReturnValue(
        of({ message: 'success', data: MOCK_TENANT_PROFILE }),
      );

      component.successMessage.set('Anterior');
      component.form.patchValue({ name: 'Test' });
      component.onSubmit();

      expect(component.successMessage()).not.toBe('Anterior');
    });

    it('debe validar patrón de URL en website', () => {
      component.form.patchValue({ website: 'not-a-url' });

      expect(component.websiteControl.hasError('pattern')).toBe(true);
    });

    it('debe validar longitud mínima del nombre', () => {
      component.form.patchValue({ name: 'ab' });

      expect(component.nameControl.hasError('minlength')).toBe(true);
    });

    it('debe permitir campos opcionales vacíos', () => {
      component.form.patchValue({
        name: 'Hotel Test',
        contactPhone: '',
        address: '',
      });

      expect(component.form.valid).toBe(true);
    });
  });
});
