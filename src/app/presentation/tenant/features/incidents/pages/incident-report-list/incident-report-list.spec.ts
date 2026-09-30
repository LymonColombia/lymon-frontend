import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { IncidentReportListComponent } from './incident-report-list';
import { GetIncidentReportsUseCase } from '@/domain/tenant/incident-report/use-cases/get-incident-reports.use-case';
import { GetPropertiesUseCase } from '@/domain/shared/property/use-cases/get-properties.use-case';
import { Property } from '@/domain/shared/property/property.model';
import { IncidentReport } from '@/domain/tenant/incident-report/incident-report.model';

// ─── Fixtures ──────────────────────────────────────────────────────────────

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

const MOCK_REPORTS: IncidentReport[] = [
  {
    id: '69a6fddf69a4f74c79b67ec2',
    title: 'Daño general',
    description: 'Glass was broken after guests left',
    propertyId: PROPERTY_ID,
    createdAt: '2026-03-04T10:00:00Z',
    createdBy: 'user-123',
    attachmentUrls: ['https://storage.com/photo1.jpg'],
  },
];

// ─── Suite ─────────────────────────────────────────────────────────────────

describe('IncidentReportListComponent — Listar Novedades Laborales', () => {
  let fixture: ComponentFixture<IncidentReportListComponent>;
  let component: IncidentReportListComponent;
  let getMock: ReturnType<typeof vi.fn>;
  let getPropertiesMock: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(async () => {
    getMock = vi.fn();
    getPropertiesMock = vi.fn().mockReturnValue(of(SINGLE_PROPERTY));

    await TestBed.configureTestingModule({
      imports: [IncidentReportListComponent],
      providers: [
        provideRouter([]),
        { provide: GetIncidentReportsUseCase, useValue: { execute: getMock } },
        { provide: GetPropertiesUseCase, useValue: { execute: getPropertiesMock } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentReportListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  // ─── Carga de propiedades ────────────────────────────────────────────────

  describe('Carga de propiedades', () => {
    it('debe consultar el id de propiedad y no el de la cuenta', () => {
      getMock.mockReturnValue(of(MOCK_REPORTS));

      fixture.detectChanges();

      expect(getPropertiesMock).toHaveBeenCalled();
      expect(getMock).toHaveBeenCalledWith(PROPERTY_ID);
    });

    it('debe seleccionar la primera propiedad cuando hay varias', () => {
      getPropertiesMock.mockReturnValue(of(MULTIPLE_PROPERTIES));
      getMock.mockReturnValue(of(MOCK_REPORTS));

      fixture.detectChanges();

      expect(component.properties().length).toBe(2);
      expect(component.selectedPropertyId()).toBe(PROPERTY_ID);
      expect(getMock).toHaveBeenCalledWith(PROPERTY_ID);
    });

    it('debe marcar que no hay propiedades cuando la cuenta no tiene ninguna', () => {
      getPropertiesMock.mockReturnValue(of([]));

      fixture.detectChanges();

      expect(component.hasNoProperties()).toBe(true);
      expect(component.isLoading()).toBe(false);
      expect(getMock).not.toHaveBeenCalled();
    });

    it('debe reportar error si falla la carga de propiedades', () => {
      getPropertiesMock.mockReturnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();

      expect(component.errorMessage()).toBe(
        'No se pudieron cargar las propiedades de tu cuenta.',
      );
      expect(getMock).not.toHaveBeenCalled();
    });
  });

  // ─── GET: Cargar novedades por propiedad ────────────────────────────────

  describe('GET /incident-reports/by-property/:id — Cargar lista', () => {
    it('debe cargar novedades exitosamente', () => {
      getMock.mockReturnValue(of(MOCK_REPORTS));

      fixture.detectChanges();

      expect(getMock).toHaveBeenCalledWith(PROPERTY_ID);
      expect(component.isLoading()).toBe(false);
      expect(component.reports().length).toBe(1);
      expect(component.reports()[0].title).toBe('Daño general');
    });

    it('debe mostrar estado vacío cuando no hay novedades', () => {
      getMock.mockReturnValue(of([]));

      fixture.detectChanges();

      expect(component.isLoading()).toBe(false);
      expect(component.reports().length).toBe(0);
    });

    it('debe mostrar error cuando falla la carga', () => {
      getMock.mockReturnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();

      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe(
        'Error al cargar las novedades. Inténtalo de nuevo.',
      );
    });

    it('debe recargar al cambiar la propiedad seleccionada', () => {
      getPropertiesMock.mockReturnValue(of(MULTIPLE_PROPERTIES));
      getMock.mockReturnValue(of(MOCK_REPORTS));
      fixture.detectChanges();
      getMock.mockClear();

      component.onPropertyChange({ target: { value: OTHER_PROPERTY_ID } } as unknown as Event);

      expect(component.selectedPropertyId()).toBe(OTHER_PROPERTY_ID);
      expect(getMock).toHaveBeenCalledWith(OTHER_PROPERTY_ID);
    });

    it('debe limpiar la lista si se deselecciona la propiedad', () => {
      getMock.mockReturnValue(of(MOCK_REPORTS));
      fixture.detectChanges();

      component.onPropertyChange({ target: { value: '' } } as unknown as Event);

      expect(component.reports()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });

    it('debe mantener loading en true hasta recibir respuesta', () => {
      getMock.mockReturnValue(of(MOCK_REPORTS));

      expect(component.isLoading()).toBe(true);
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);
    });

    it('debe cargar múltiples novedades', () => {
      const multipleReports: IncidentReport[] = [
        ...MOCK_REPORTS,
        {
          id: '69a6fddf69a4f74c79b67ec3',
          title: 'Ausencia de empleado',
          description: 'Employee absent',
          propertyId: PROPERTY_ID,
          createdAt: '2026-03-04T11:00:00Z',
        },
      ];

      getMock.mockReturnValue(of(multipleReports));

      fixture.detectChanges();

      expect(component.reports().length).toBe(2);
    });
  });

  // ─── Navegación a editar ────────────────────────────────────────────────

  describe('Navegación — Editar novedad', () => {
    beforeEach(() => {
      getMock.mockReturnValue(of(MOCK_REPORTS));
      fixture.detectChanges();
    });

    it('debe navegar a editar con el report en state', () => {
      const report = MOCK_REPORTS[0];
      vi.spyOn(router, 'navigate');

      component.navigateToEdit(report);

      expect(router.navigate).toHaveBeenCalledWith(
        ['/admin/incidents', report.id, 'edit'],
        { state: { report } },
      );
    });

    it('debe navegar con el ID correcto', () => {
      const report = MOCK_REPORTS[0];
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.navigateToEdit(report);

      expect(navigateSpy).toHaveBeenCalled();
      const call = navigateSpy.mock.calls[0];
      expect(call[0][1]).toBe(MOCK_REPORTS[0].id);
    });
  });

  // ─── Formateo de fechas ────────────────────────────────────────────────

  describe('Formateo de fechas — Español', () => {
    it('debe formatear fecha correctamente en español', () => {
      getMock.mockReturnValue(of(MOCK_REPORTS));
      fixture.detectChanges();

      const dateStr = '2026-03-04T10:30:00Z';
      const formatted = component.formatDate(dateStr);

      expect(formatted).toContain('4');
      expect(formatted).toContain('mar');
    });

    it('debe incluir hora en el formato', () => {
      getMock.mockReturnValue(of(MOCK_REPORTS));
      fixture.detectChanges();

      const dateStr = '2026-03-04T14:45:00Z';
      const formatted = component.formatDate(dateStr);

      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });
});
