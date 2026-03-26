import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EditIncidentReportComponent } from './editIncidentReport';
import { UpdateIncidentReportUseCase } from '@/domain/use-cases/update-incident-report.use-case';
import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { IncidentReport } from '@/domain/entities/incident-report.model';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const MOCK_REPORT: IncidentReport = {
  id: '69a6fddf69a4f74c79b67ec2',
  title: 'Daño general',
  description: 'Glass was broken after guests left',
  propertyId: '69a6379a2ffa06e9f5cdf556',
  createdAt: '2026-03-04T10:00:00Z',
  createdBy: 'user-123',
  attachmentUrls: ['https://storage.com/photo1.jpg', 'https://storage.com/photo2.jpg'],
};

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, url: '/api/incident-reports/:id' });
}

// ─── Suite ─────────────────────────────────────────────────────────────────

describe('EditIncidentReportComponent — Editar Novedad Laboral', () => {
  let fixture: ComponentFixture<EditIncidentReportComponent>;
  let component: EditIncidentReportComponent;
  let updateMock: ReturnType<typeof vi.fn>;
  let router: Router;
  let activatedRoute: ActivatedRoute;

  beforeEach(async () => {
    updateMock = vi.fn();

    await TestBed.configureTestingModule({
      imports: [EditIncidentReportComponent, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: UpdateIncidentReportUseCase, useValue: { execute: updateMock } },
        { provide: GetTenantProfileUseCase, useValue: { execute: () => of({ data: {} }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditIncidentReportComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);

    vi.spyOn(activatedRoute.snapshot.paramMap, 'get').mockReturnValue(MOCK_REPORT.id);
    vi.spyOn(router, 'currentNavigation').mockReturnValue({ extras: { state: { report: MOCK_REPORT } } } as any);
  });

  // ─── Inicialización ────────────────────────────────────────────────────────

  describe('Inicialización — Cargar reporte desde state', () => {
    it('debe cargar el reporte desde el state y poblar el formulario', () => {
      fixture.detectChanges();

      expect(component.reportId()).toBe('69a6fddf69a4f74c79b67ec2');
      expect(component.titleControl.value).toBe('Daño general');
      expect(component.descriptionControl.value).toBe('Glass was broken after guests left');
      expect(component.attachmentUrlsArray.length).toBe(2);
    });

    it('debe mostrar notFound cuando falta el ID en la ruta', () => {
      vi.spyOn(activatedRoute.snapshot.paramMap, 'get').mockReturnValue(null);

      fixture.detectChanges();

      expect(component.notFound()).toBe(true);
    });

    it('debe mostrar notFound cuando falta el report en state', () => {
      vi.spyOn(router, 'currentNavigation').mockReturnValue({ extras: { state: {} } } as any);

      fixture.detectChanges();

      expect(component.notFound()).toBe(true);
    });
  });

  // ─── PATCH: Actualizar novedad ─────────────────────────────────────────────

  describe('PATCH /incident-reports/:id — Actualizar novedad', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe actualizar la novedad exitosamente', () => {
      updateMock.mockReturnValue(of({ message: 'success', data: MOCK_REPORT }));
      vi.spyOn(router, 'navigate');

      component.form.patchValue({
        title: 'Daño en ventana',
        description: 'El vidrio de la ventana principal fue roto.',
      });

      component.onSubmit();

      expect(updateMock).toHaveBeenCalledWith('69a6fddf69a4f74c79b67ec2', {
        title: 'Daño en ventana',
        description: 'El vidrio de la ventana principal fue roto.',
        attachmentUrls: ['https://storage.com/photo1.jpg', 'https://storage.com/photo2.jpg'],
      });
      expect(router.navigate).toHaveBeenCalledWith(['/incident-report/list']);
    });

    it('debe mostrar error 403 (sin permiso)', () => {
      updateMock.mockReturnValue(throwError(() => httpError(403)));

      component.form.patchValue({
        title: 'Título válido',
        description: 'Descripción válida para la prueba.',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBe('No tienes permiso para editar esta novedad.');
      expect(component.isSubmitting()).toBe(false);
    });

    it('debe mostrar error 404 (no encontrado)', () => {
      updateMock.mockReturnValue(throwError(() => httpError(404)));

      component.form.patchValue({
        title: 'Título válido',
        description: 'Descripción válida para la prueba.',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBe('La novedad no fue encontrada.');
    });

    it('debe mostrar error 400 (datos inválidos)', () => {
      updateMock.mockReturnValue(throwError(() => httpError(400)));

      component.form.patchValue({
        title: 'Título válido',
        description: 'Descripción válida para la prueba.',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Datos inválidos. Verifica los campos e intenta de nuevo.',
      );
    });

    it('debe mostrar error genérico para otros estatus', () => {
      updateMock.mockReturnValue(throwError(() => httpError(500)));

      component.form.patchValue({
        title: 'Título válido',
        description: 'Descripción válida para la prueba.',
      });
      component.onSubmit();

      expect(component.errorMessage()).toBe(
        'Ocurrió un error inesperado. Inténtalo de nuevo.',
      );
    });

    it('no debe enviar si el formulario es inválido', () => {
      component.form.patchValue({ title: '', description: '' });
      component.form.markAllAsTouched();

      component.onSubmit();

      expect(updateMock).not.toHaveBeenCalled();
    });

    it('debe validar longitud mínima del título', () => {
      component.form.patchValue({ title: 'ab' });

      expect(component.titleControl.hasError('minlength')).toBe(true);
    });

    it('debe validar longitud mínima de la descripción', () => {
      component.form.patchValue({ description: 'abc' });

      expect(component.descriptionControl.hasError('minlength')).toBe(true);
    });
  });

  // ─── Manejo de URLs adjuntas ──────────────────────────────────────────────

  describe('FormArray de URLs adjuntas — Agregar y eliminar', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe retornar el mismo AbstractControl recibido', () => {
      const ctrl = component.attachmentUrlsArray.at(0);

      const result = component.asAbstractControl(ctrl);

      expect(result).toBe(ctrl);
    });

    it('debe agregar una URL de archivo adjunto', () => {
      const initialLength = component.attachmentUrlsArray.length;

      component.addAttachmentUrl('https://storage.com/photo3.jpg');

      expect(component.attachmentUrlsArray.length).toBe(initialLength + 1);
    });

    it('debe remover una URL de archivo adjunto', () => {
      const initialLength = component.attachmentUrlsArray.length;

      component.removeAttachmentUrl(0);

      expect(component.attachmentUrlsArray.length).toBe(initialLength - 1);
    });

    it('debe validar patrón de URL en archivos adjuntos', () => {
      component.addAttachmentUrl('not-a-url');

      expect(component.attachmentUrlsArray.at(component.attachmentUrlsArray.length - 1)?.invalid).toBe(true);
    });

    it('debe aceptar URLs válidas', () => {
      component.addAttachmentUrl('https://storage.com/valid.jpg');

      expect(component.attachmentUrlsArray.at(component.attachmentUrlsArray.length - 1)?.valid).toBe(true);
    });

    it('debe permitir agregar una URL vacía para llenar después', () => {
      component.addAttachmentUrl();

      expect(component.attachmentUrlsArray.at(component.attachmentUrlsArray.length - 1)?.value).toBe('');
    });
  });

  // ─── Validación del formulario ────────────────────────────────────────────

  describe('Validación del formulario', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('debe requerir título', () => {
      component.form.patchValue({ title: '' });

      expect(component.titleControl.hasError('required')).toBe(true);
    });

    it('debe requerir descripción', () => {
      component.form.patchValue({ description: '' });

      expect(component.descriptionControl.hasError('required')).toBe(true);
    });

    it('debe permitir formulario sin cambios', () => {
      expect(component.form.valid).toBe(true);
    });
  });
});
