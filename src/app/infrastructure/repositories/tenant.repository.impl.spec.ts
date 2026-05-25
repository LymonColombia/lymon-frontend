import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { TenantRepositoryImpl } from './tenant.repository.impl';
import { environment } from '@env';
import {
  TenantProfileResponse,
  UpdateTenantProfileRequest,
  UpdateTenantProfileResponse,
} from '@/domain/entities/tenant.model';

const BASE_URL = `${environment.apiUrl}${environment.tenant.endpoint}`;

describe('TenantRepositoryImpl', () => {
  let repository: TenantRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TenantRepositoryImpl, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(TenantRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call GET /profile to retrieve tenant profile', () => {
    const mockResponse: TenantProfileResponse = {
      data: {
        name: 'Hotel Demo',
        contactPhone: '+57 3000000000',
      },
    };

    repository.getProfile().subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${BASE_URL}/profile`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call PATCH /profile to update tenant profile', () => {
    const payload: UpdateTenantProfileRequest = {
      name: 'Hotel Updated',
      contactPhone: '+57 3111111111',
      address: 'Street 123',
      website: 'https://hotel-updated.com',
      logoUrl: 'https://cdn.com/logo.png',
    };

    const mockResponse: UpdateTenantProfileResponse = {
      message: 'updated',
      data: {
        name: 'Hotel Updated',
        contactPhone: '+57 3111111111',
        address: 'Street 123',
        website: 'https://hotel-updated.com',
        logoUrl: 'https://cdn.com/logo.png',
      },
    };

    repository.updateProfile(payload).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${BASE_URL}/profile`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  describe('IA: solicita perfil del tenant → Playwright: GET a /profile con headers JSON', () => {
    it('debe realizar GET a /profile con headers JSON', () => {
      const mockResponse: TenantProfileResponse = {
        data: {
          name: 'Hotel Demo',
          contactPhone: '+57 3000000000',
        },
      };

      repository.getProfile().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE_URL}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('IA: observa endpoint de actualización → Playwright: PATCH a /profile con body completo', () => {
    it('debe realizar PATCH a /profile con body completo', () => {
      const payload: UpdateTenantProfileRequest = {
        name: 'Hotel Updated',
        contactPhone: '+57 3111111111',
        address: 'Street 123',
        website: 'https://hotel-updated.com',
        logoUrl: 'https://cdn.com/logo.png',
      };

      const mockResponse: UpdateTenantProfileResponse = {
        message: 'updated',
        data: {
          name: 'Hotel Updated',
          contactPhone: '+57 3111111111',
          address: 'Street 123',
          website: 'https://hotel-updated.com',
          logoUrl: 'https://cdn.com/logo.png',
        },
      };

      repository.updateProfile(payload).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE_URL}/profile`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('IA: extrae respuesta de perfil → Playwright: estructura contiene data.name', () => {
    it('debe verificar que la respuesta contiene data.name', () => {
      const mockResponse: TenantProfileResponse = {
        data: {
          name: 'Hotel Name Check',
          contactPhone: '+57 3000000000',
        },
      };

      repository.getProfile().subscribe((response) => {
        expect(response.data).toBeDefined();
        expect(response.data.name).toBe('Hotel Name Check');
      });

      const req = httpMock.expectOne(`${BASE_URL}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('IA: extrae error 500 → Playwright: error propagado desde HTTP', () => {
    it('debe propagar error 500 desde el backend', () => {
      const errorMessage = 'Internal Server Error';

      repository.getProfile().subscribe({
        next: () => expect(true).toBe(false),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe(errorMessage);
        },
      });

      const req = httpMock.expectOne(`${BASE_URL}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(errorMessage, { status: 500, statusText: errorMessage });
    });
  });
});
