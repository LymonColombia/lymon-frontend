import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { IncidentReportRepositoryImpl } from './incident-report.repository.impl';
import { environment } from '@env';
import {
  CreateIncidentReportRequest,
  CreateIncidentReportResponse,
  GetIncidentReportsResponse,
  UpdateIncidentReportRequest,
  UpdateIncidentReportResponse,
} from '@/domain/entities/incident-report.model';

const BASE_URL = `${environment.apiUrl}${environment.incidentReport.endpoint}`;

describe('IncidentReportRepositoryImpl', () => {
  let repository: IncidentReportRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IncidentReportRepositoryImpl, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(IncidentReportRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call POST /incident-reports to create an incident report', () => {
    const payload: CreateIncidentReportRequest = {
      title: 'Leak in room',
      description: 'Water leak reported by housekeeping',
      propertyId: 'property-123',
    };

    const mockResponse: CreateIncidentReportResponse = {
      message: 'created',
      data: {
        id: 'incident-1',
        title: payload.title,
        description: payload.description,
        propertyId: payload.propertyId,
        createdAt: '2026-03-25T00:00:00Z',
      },
    };

    repository.create(payload).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should call GET /by-property/:id to retrieve incident reports', () => {
    const propertyId = 'property-123';
    const mockResponse: GetIncidentReportsResponse = {
      data: [
        {
          id: 'incident-1',
          title: 'Leak in room',
          description: 'Water leak reported by housekeeping',
          propertyId,
          createdAt: '2026-03-25T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    };

    repository.getAll(propertyId).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${BASE_URL}/by-property/${propertyId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call PATCH /:id to update an incident report', () => {
    const incidentId = 'incident-1';
    const payload: UpdateIncidentReportRequest = {
      title: 'Updated title',
      description: 'Updated description',
      attachmentUrls: ['https://cdn.com/1.jpg'],
    };

    const mockResponse: UpdateIncidentReportResponse = {
      message: 'updated',
      data: {
        id: incidentId,
        title: 'Updated title',
        description: 'Updated description',
        propertyId: 'property-123',
        createdAt: '2026-03-25T00:00:00Z',
        attachmentUrls: ['https://cdn.com/1.jpg'],
      },
    };

    repository.update(incidentId, payload).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${BASE_URL}/${incidentId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  describe('IA: registra novedad laboral → Playwright: POST con title, description, propertyId', () => {
    it('debe realizar POST con los campos requeridos', () => {
      const payload: CreateIncidentReportRequest = {
        title: 'Accidente laboral',
        description: 'Ocurrió un accidente en la zona de carga',
        propertyId: 'prop-456',
      };

      const mockResponse: CreateIncidentReportResponse = {
        message: 'created',
        data: {
          id: 'incident-2',
          title: payload.title,
          description: payload.description,
          propertyId: payload.propertyId,
          createdAt: '2026-05-25T00:00:00Z',
        },
      };

      repository.create(payload).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.body.title).toBe('Accidente laboral');
      expect(req.request.body.description).toBe('Ocurrió un accidente en la zona de carga');
      expect(req.request.body.propertyId).toBe('prop-456');
      req.flush(mockResponse);
    });
  });

  describe('IA: lista novedades por propiedad → Playwright: GET a by-property/:id', () => {
    it('debe realizar GET a by-property con el id correcto', () => {
      const propertyId = 'prop-789';
      const mockResponse: GetIncidentReportsResponse = {
        data: [
          {
            id: 'incident-3',
            title: 'Falla eléctrica',
            description: 'Apagón en el edificio A',
            propertyId,
            createdAt: '2026-05-25T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      repository.getAll(propertyId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE_URL}/by-property/${propertyId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('IA: actualiza novedad → Playwright: PATCH con attachmentUrls', () => {
    it('debe realizar PATCH con attachmentUrls', () => {
      const incidentId = 'incident-4';
      const payload: UpdateIncidentReportRequest = {
        title: 'Título actualizado',
        description: 'Descripción actualizada',
        attachmentUrls: ['https://cdn.com/doc1.pdf', 'https://cdn.com/doc2.pdf'],
      };

      const mockResponse: UpdateIncidentReportResponse = {
        message: 'updated',
        data: {
          id: incidentId,
          title: payload.title!,
          description: payload.description!,
          propertyId: 'prop-456',
          createdAt: '2026-05-25T00:00:00Z',
          attachmentUrls: payload.attachmentUrls,
        },
      };

      repository.update(incidentId, payload).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE_URL}/${incidentId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      expect(req.request.body.attachmentUrls).toEqual([
        'https://cdn.com/doc1.pdf',
        'https://cdn.com/doc2.pdf',
      ]);
      req.flush(mockResponse);
    });
  });

  describe('IA: observa contrato de creación → Playwright: respuesta contiene data.id y createdAt', () => {
    it('debe verificar que la respuesta contiene id y createdAt', () => {
      const payload: CreateIncidentReportRequest = {
        title: 'Robo',
        description: 'Robo en zona común',
        propertyId: 'prop-999',
      };

      const mockResponse: CreateIncidentReportResponse = {
        message: 'created',
        data: {
          id: 'incident-5',
          title: payload.title,
          description: payload.description,
          propertyId: payload.propertyId,
          createdAt: '2026-05-25T12:30:00Z',
        },
      };

      repository.create(payload).subscribe((response) => {
        expect(response.data.id).toBe('incident-5');
        expect(response.data.createdAt).toBe('2026-05-25T12:30:00Z');
      });

      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('IA: extrae error de red → Playwright: error 404 en GET devuelve Not Found', () => {
    it('debe propagar error 404 como Not Found', () => {
      const propertyId = 'prop-not-found';

      repository.getAll(propertyId).subscribe({
        next: () => expect(true).toBe(false),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.statusText).toBe('Not Found');
        },
      });

      const req = httpMock.expectOne(`${BASE_URL}/by-property/${propertyId}`);
      expect(req.request.method).toBe('GET');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
