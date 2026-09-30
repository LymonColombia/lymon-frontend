import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CreateIncidentReportComponent } from './create-incident-report';
import { CreateIncidentReportUseCase } from '@/domain/tenant/incident-report/use-cases/create-incident-report.use-case';
import { GetPropertiesUseCase } from '@/domain/shared/property/use-cases/get-properties.use-case';
import { Property } from '@/domain/shared/property/property.model';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PROPERTY_ID = '69a6379a2ffa06e9f5cdf556';
const OTHER_PROPERTY_ID = '69a6379a2ffa06e9f5cdf999';

function property(id: string, name: string): Property {
  return { id, name, propertyType: 'HOTEL', city: 'Medellín' };
}

const SINGLE_PROPERTY: Property[] = [property(PROPERTY_ID, 'Hotel Boutique')];

const MULTIPLE_PROPERTIES: Property[] = [
  ...SINGLE_PROPERTY,
  property(OTHER_PROPERTY_ID, 'Finca La Montana'),
];

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/incident-reports' });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('CreateIncidentReportComponent — Registrar Novedad Laboral', () => {
  let fixture: ComponentFixture<CreateIncidentReportComponent>;
  let component: CreateIncidentReportComponent;
  let createMock: ReturnType<typeof vi.fn>;
  let getPropertiesMock: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(async () => {
    createMock = vi.fn().mockReturnValue(of({ message: 'success', data: {} }));
    getPropertiesMock = vi.fn().mockReturnValue(of(SINGLE_PROPERTY));

    await TestBed.configureTestingModule({
      imports: [CreateIncidentReportComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: CreateIncidentReportUseCase, useValue: { execute: createMock } },
        { provide: GetPropertiesUseCase, useValue: { execute: getPropertiesMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateIncidentReportComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  // ── Carga de propiedades ──────────────────────────────────────────────────

  describe('Carga de propiedades', () => {
    it('debe cargar las propiedades de la cuenta', () => {
      expect(getPropertiesMock).toHaveBeenCalled();
      expect(component.properties()).toEqual(SINGLE_PROPERTY);
    });

    it('debe preseleccionar la propiedad cuando hay exactamente una', () => {
      expect(component.form.controls.propertyId.value).toBe(PROPERTY_ID);
    });

    it('no debe preseleccionar nada cuando hay varias propiedades', () => {
      getPropertiesMock.mockReturnValue(of(MULTIPLE_PROPERTIES));
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.properties().length).toBe(2);
      expect(component.form.controls.propertyId.value).toBe('');
    });

    it('debe marcar que no hay propiedades cuando la cuenta no tiene ninguna', () => {
      getPropertiesMock.mockReturnValue(of([]));
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.properties()).toEqual([]);
      expect(component.hasNoProperties()).toBe(true);
    });

    it('debe reportar error si falla la carga de propiedades', () => {
      getPropertiesMock.mockReturnValue(throwError(() => new Error('Network error')));
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.errorMessage()).toBe(
        'No se pudieron cargar las propiedades de tu cuenta.',
      );
      expect(component.hasNoProperties()).toBe(true);
    });
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
      expect(router.navigate).toHaveBeenCalledWith(['/admin/incidents']);
    });

    it('debe enviar el id de la propiedad seleccionada, no el de la cuenta', () => {
      getPropertiesMock.mockReturnValue(of(MULTIPLE_PROPERTIES));
      component.ngOnInit();
      fixture.detectChanges();

      createMock.mockReturnValue(of({ message: 'success', data: {} }));

      component.form.patchValue({
        propertyId: OTHER_PROPERTY_ID,
        title: 'Daño general',
        description: 'Una prueba completa de la novedad del incidente',
      });
      component.onSubmit();

      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: OTHER_PROPERTY_ID }),
      );
    });

    it('no debe enviar si no se ha seleccionado propiedad', () => {
      getPropertiesMock.mockReturnValue(of(MULTIPLE_PROPERTIES));
      component.ngOnInit();
      fixture.detectChanges();

      component.form.patchValue({
        title: 'Test',
        description: 'Test description here',
      });
      component.propertyIdControl.markAsTouched();
      component.onSubmit();

      expect(component.propertyIdControl.hasError('required')).toBe(true);
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
      expect(component.propertyIdControl.hasError('required')).toBe(true);
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
});
