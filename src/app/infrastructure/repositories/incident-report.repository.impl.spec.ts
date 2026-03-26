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
});
