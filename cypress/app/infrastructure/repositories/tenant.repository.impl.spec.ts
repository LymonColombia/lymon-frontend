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
});
