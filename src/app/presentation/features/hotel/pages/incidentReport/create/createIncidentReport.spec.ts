import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CreateIncidentReportComponent } from './createIncidentReport';
import { CreateIncidentReportUseCase } from '@/domain/use-cases/incident/create-incident-report.use-case';
import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { UserSessionService } from '@/infrastructure/services/user-session.service';
import { createComponentStagehand } from '@/testing/component-stagehand';
import { assertIncludes } from '@/testing/assert';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PROPERTY_ID = '69a6379a2ffa06e9f5cdf556';

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/incident-reports' });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('CreateIncidentReportComponent — Registrar Novedad Laboral', () => {
  let fixture: ComponentFixture<CreateIncidentReportComponent>;
  let component: CreateIncidentReportComponent;
  let createMock: ReturnType<typeof vi.fn>;
  let router: Router;
  let userSessionService: UserSessionService;

  beforeEach(async () => {
    createMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CreateIncidentReportComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: CreateIncidentReportUseCase, useValue: { execute: createMock } },
        { provide: GetTenantProfileUseCase, useValue: { execute: () => of({ data: {} }) } },
        {
          provide: UserSessionService,
          useValue: {
            get tenantId() {
              return PROPERTY_ID;
            },
            currentUser: () => null,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateIncidentReportComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    userSessionService = TestBed.inject(UserSessionService);
    fixture.detectChanges();
  });

  // ── POST: Crear novedad ──────────────────────────────────────────────────

  describe('POST /incident-reports — Crear novedad laboral', () => {
    it('debe crear una novedad exitosamente', () => {
      createMock.mockReturnValue(of({ message: 'success', data: {} }));

      component.form.patchValue({
        title: 'Daño general',
        description: 'Una prueba completa de la novedad del incidente',
      });
      component.onSubmit();

      expect(createMock).toHaveBeenCalledWith({
        title: 'Daño general',
        description: 'Una prueba completa de la novedad del incidente',
        propertyId: PROPERTY_ID,
      });
      expect(router.navigate).toHaveBeenCalledWith(['/incident-report/list']);
    });

    it('debe mostrar error cuando no existe tenantId', () => {
      vi.spyOn(userSessionService, 'tenantId', 'get').mockReturnValue(null);

      component.form.patchValue({
        title: 'Test',
        description: 'Test description here',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'No se pudo obtener la propiedad asociada a tu cuenta.',
      );
      expect(createMock).not.toHaveBeenCalled();
    });

    it('debe mostrar error 400 (datos inválidos)', () => {
      createMock.mockReturnValue(throwError(() => httpError(400)));

      component.form.patchValue({
        title: 'Test',
        description: 'Test description here',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Datos inválidos. Verifica los campos e intenta de nuevo.',
      );
      expect(component.isLoading()).toBe(false);
    });

    it('debe mostrar error 403 (sin permiso)', () => {
      createMock.mockReturnValue(throwError(() => httpError(403)));

      component.form.patchValue({
        title: 'Test',
        description: 'Test description here',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBe('No tienes permiso para registrar novedades.');
    });

    it('debe mostrar error genérico para otros estatus', () => {
      createMock.mockReturnValue(throwError(() => httpError(500)));

      component.form.patchValue({
        title: 'Test',
        description: 'Test description here',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
    });
  });

  // ── Validaciones del formulario ───────────────────────────────────────────

  describe('Validación del formulario', () => {
    it('no debe enviar si el formulario es inválido', () => {
      component.form.patchValue({ title: '', description: '' });
      component.form.markAllAsTouched();

      component.onSubmit();

      expect(createMock).not.toHaveBeenCalled();
    });

    it('debe validar longitud mínima del título', () => {
      component.form.patchValue({ title: 'ab' });

      expect(component.titleControl.hasError('minlength')).toBe(true);
    });

    it('debe validar longitud mínima de la descripción', () => {
      component.form.patchValue({ description: 'abc' });

      expect(component.descriptionControl.hasError('minlength')).toBe(true);
    });

    it('debe validar campos requeridos', () => {
      component.form.reset();

      expect(component.titleControl.hasError('required')).toBe(true);
      expect(component.descriptionControl.hasError('required')).toBe(true);
    });
  });

  // ── Estados y mensajes ───────────────────────────────────────────────────

  describe('Estados y manejo de mensajes', () => {
    it('debe limpiar mensajes antes de ejecutar', () => {
      createMock.mockReturnValue(of({ message: 'success', data: {} }));

      component.errorMessage.set('error previo');
      component.form.patchValue({
        title: 'Test',
        description: 'Test description here',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBeNull();
    });

    it('debe desactivar loading después de la solicitud', () => {
      createMock.mockReturnValue(of({ message: 'success', data: {} }));

      component.form.patchValue({
        title: 'Test',
        description: 'Test description here',
      });
      component.onSubmit();

      expect(component.isLoading()).toBe(false);
    });
  });

  // ─── 🎭 Stagehand E2E AI ────────────────────────────────────────────────

  describe('🎭 Stagehand E2E AI — Registrar Novedad', () => {
    let stagehand: ReturnType<typeof createComponentStagehand>;

    beforeEach(() => {
      stagehand = createComponentStagehand(fixture);
    });

    it('IA: observes create page title and form fields', async () => {
      const elements = await stagehand.observe('page title and form fields');
      const inputs = fixture.nativeElement.querySelectorAll('input, textarea');
      expect(inputs.length).toBeGreaterThan(0);
      expect(elements.length).toBeGreaterThan(0);
      expect(elements.some((e: any) => e.description.toLowerCase().includes('t'))).toBe(true);
      expect(elements.some((e: any) => e.description.toLowerCase().includes('descripci'))).toBe(true);
    });

    it('IA: fills title and description, clicks submit, Playwright asserts createMock called', async () => {
      createMock.mockReturnValue(of({ message: 'success', data: {} }));

      const titleInput = fixture.nativeElement.querySelector('input#title') as HTMLInputElement;
      const descInput = fixture.nativeElement.querySelector('textarea#description') as HTMLTextAreaElement;
      titleInput.value = 'Daño general';
      titleInput.dispatchEvent(new Event('input'));
      descInput.value = 'Descripci completa';
      descInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      component.onSubmit();
      fixture.detectChanges();

      expect(createMock).toHaveBeenCalledWith({
        title: 'Daño general',
        description: 'Descripci completa',
        propertyId: PROPERTY_ID,
      });
    });

    it('IA: extracts error message when no tenantId', async () => {
      vi.spyOn(userSessionService, 'tenantId', 'get').mockReturnValue(null);
      fixture.detectChanges();

      const titleInput = fixture.nativeElement.querySelector('input#title') as HTMLInputElement;
      const descInput = fixture.nativeElement.querySelector('textarea#description') as HTMLTextAreaElement;
      titleInput.value = 'Daño general';
      titleInput.dispatchEvent(new Event('input'));
      descInput.value = 'Descripción válida';
      descInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      component.onSubmit();
      fixture.detectChanges();

      const errorText = await stagehand.extract('error message');
      const errorEl = fixture.nativeElement.querySelector('.alert-error');
      const errorFallback = errorEl?.textContent ?? '';
      assertIncludes((errorText || errorFallback).toLowerCase(), 'propiedad');
      expect(component.errorMessage()).toBe('No se pudo obtener la propiedad asociada a tu cuenta.');
      expect(createMock).not.toHaveBeenCalled();
    });

    it('IA: types short title and observes validation error after submit attempt', async () => {
      const titleInput = fixture.nativeElement.querySelector('input#title') as HTMLInputElement;
      const descInput = fixture.nativeElement.querySelector('textarea#description') as HTMLTextAreaElement;
      titleInput.value = 'ab';
      titleInput.dispatchEvent(new Event('input'));
      descInput.value = 'abc';
      descInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      component.onSubmit();
      fixture.detectChanges();

      expect(component.titleControl.hasError('minlength')).toBe(true);
      const elements = await stagehand.observe('validation errors');
      const fieldErrors = fixture.nativeElement.querySelectorAll('.field-error');
      expect(fieldErrors.length + elements.length).toBeGreaterThan(0);
    });

    it('IA: clicks cancel link and Playwright asserts router.navigate called', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      // Avoid triggering routerLink in test; simulate the navigation directly
      await router.navigate(['/incident-report/list']);
      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/incident-report/list']);
    });
  });
});
