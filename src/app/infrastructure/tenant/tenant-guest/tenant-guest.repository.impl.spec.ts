import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { TenantGuestRepositoryImpl } from './tenant-guest.repository.impl';
import { environment } from '@env';
import {
  CreateTenantGuestRequest,
  CreateTenantGuestResponse,
  GetTenantGuestsResponse,
  TenantGuest,
} from '@/domain/tenant/tenant-guest/tenant-guest.model';

const GUESTS_URL = `${environment.apiUrl}${environment.guests.endpoint}`;

describe('TenantGuestRepositoryImpl', () => {
  let repository: TenantGuestRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TenantGuestRepositoryImpl, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(TenantGuestRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(repository).toBeTruthy();
  });

  describe('createGuest()', () => {
    it('should call POST /guests with the payload and map res.data', () => {
      const payload: CreateTenantGuestRequest = {
        fullName: 'Juan Pérez',
        primaryEmail: 'juan.perez@example.com',
        identity: null,
        firstName: '',
        lastName: '',
        tags: [],
        preferences: [],
      };

      const mockResponse: CreateTenantGuestResponse = {
        guestId: 'guest-123',
        fullName: 'Juan Pérez',
        primaryEmail: 'juan.perez@example.com',
      };

      let result: CreateTenantGuestResponse | undefined;
      repository.createGuest(payload).subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne(GUESTS_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.body).not.toHaveProperty('emails');
      expect(req.request.body).not.toHaveProperty('phones');
      req.flush({ data: mockResponse });

      expect(result).toEqual(mockResponse);
    });

    it('should propagate HTTP error when POST fails (e.g., 400 Bad Request)', () => {
      const payload: CreateTenantGuestRequest = {
        fullName: 'Juan Pérez',
        primaryEmail: 'juan.perez@example.com',
        identity: null,
        firstName: '',
        lastName: '',
        tags: [],
        preferences: [],
      };

      let hasError = false;
      let errorStatus = 0;
      repository.createGuest(payload).subscribe({
        next: () => {},
        error: (err) => {
          hasError = true;
          errorStatus = err.status;
        },
      });

      const req = httpMock.expectOne(GUESTS_URL);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      expect(hasError).toBe(true);
      expect(errorStatus).toBe(400);
    });
  });

  describe('getGuests()', () => {
    it('should call GET /guests and map res.data', () => {
      const mockGuests: TenantGuest[] = [
        { id: '1', fullName: 'Carlos' },
        { id: '2', fullName: 'Maria' },
      ];
      const apiResponse: GetTenantGuestsResponse = {
        data: mockGuests,
      };

      let result: TenantGuest[] | undefined;
      repository.getGuests().subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne(GUESTS_URL);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);

      expect(result).toEqual(mockGuests);
    });

    it('should return an empty array if res.data is falsy or missing', () => {
      let result: TenantGuest[] | undefined;
      repository.getGuests().subscribe((res) => {
        result = res;
      });

      const req = httpMock.expectOne(GUESTS_URL);
      req.flush({});

      expect(result).toEqual([]);
    });

    it('should propagate HTTP error when GET fails', () => {
      let hasError = false;
      repository.getGuests().subscribe({
        next: () => {},
        error: () => {
          hasError = true;
        },
      });

      const req = httpMock.expectOne(GUESTS_URL);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(hasError).toBe(true);
    });
  });
});
