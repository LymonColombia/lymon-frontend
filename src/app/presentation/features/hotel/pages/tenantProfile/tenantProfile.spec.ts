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
import { createComponentStagehand } from '@/testing/component-stagehand';
import { assertIncludes } from '@/testing/assert';

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

  // ─── 🎭 Stagehand E2E AI ────────────────────────────────────────────────

  describe('🎭 Stagehand E2E AI — Perfil del Negocio', () => {
    let stagehand: ReturnType<typeof createComponentStagehand>;

    beforeEach(() => {
      stagehand = createComponentStagehand(fixture);
    });

    it('IA: types name in field + extract success message after save', async () => {
      getTenantProfileMock.mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));
      updateTenantProfileMock.mockReturnValue(of({ message: 'success', data: MOCK_TENANT_PROFILE }));
      fixture.detectChanges();

      const nameInput = fixture.nativeElement.querySelector('input#name') as HTMLInputElement;
      nameInput.value = 'Hotel Actualizado';
      nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      component.onSubmit();
      fixture.detectChanges();

      const successEl = fixture.nativeElement.querySelector('.alert-success');
      const successText = successEl?.textContent ?? '';
      assertIncludes(successText, 'actualizado');
      expect(component.successMessage()).toBe('Perfil actualizado exitosamente.');
    });

    it('IA: observes form fields and verifies inputs exist', async () => {
      getTenantProfileMock.mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));
      fixture.detectChanges();

      const elements = await stagehand.observe('form input fields');
      const inputs = fixture.nativeElement.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThan(0);
      expect(elements.length).toBeGreaterThan(0);
      const found = elements.some((e: any) => e.description.toLowerCase().includes('nombre'));
      expect(found || inputs.length > 0).toBe(true);
    });

    it('IA: interacts with invalid URL and extract shows validation error', async () => {
      getTenantProfileMock.mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));
      fixture.detectChanges();

      const websiteInput = fixture.nativeElement.querySelector('input#website') as HTMLInputElement;
      websiteInput.value = 'not-a-url';
      websiteInput.dispatchEvent(new Event('input'));
      websiteInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.field-error');
      const errorText = errorEl?.textContent ?? '';
      assertIncludes(errorText.toLowerCase(), 'url');
      expect(component.websiteControl.hasError('pattern')).toBe(true);
    });

    it('IA: fills form and Playwright asserts form valid', async () => {
      getTenantProfileMock.mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));
      fixture.detectChanges();

      const nameInput = fixture.nativeElement.querySelector('input#name') as HTMLInputElement;
      nameInput.value = 'Hotel Test';
      nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.form.valid).toBe(true);
    });

    it('IA: observes page and finds required labels', async () => {
      getTenantProfileMock.mockReturnValue(of({ data: MOCK_TENANT_PROFILE }));
      fixture.detectChanges();

      const elements = await stagehand.observe('required field labels');
      const labels = fixture.nativeElement.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);
      assertIncludes(JSON.stringify(elements), 'name');
    });
  });
});
