import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { PropertyRepositoryImpl } from './property.repository.impl';
import { environment } from '@env';

const UNITS_BASE_URL = `${environment.apiUrl}${environment.units.endpoint}`;

describe('PropertyRepositoryImpl', () => {
  let repository: PropertyRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PropertyRepositoryImpl, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(PropertyRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('updateUnitMediaKeys()', () => {
    const UNIT_ID = 'unit-abc-123';
    const MEDIA_KEYS = ['uploads/room-1.jpg', 'uploads/room-2.jpg'];

    it('should send a PATCH request to /units/:id', () => {
      repository.updateUnitMediaKeys(UNIT_ID, { mediaKeys: MEDIA_KEYS }).subscribe();

      const req = httpMock.expectOne(`${UNITS_BASE_URL}/${UNIT_ID}`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });

    it('should send the mediaKeys array in the request body', () => {
      repository.updateUnitMediaKeys(UNIT_ID, { mediaKeys: MEDIA_KEYS }).subscribe();

      const req = httpMock.expectOne(`${UNITS_BASE_URL}/${UNIT_ID}`);
      expect(req.request.body).toEqual({ mediaKeys: MEDIA_KEYS });
      req.flush(null);
    });

    it('should use the unitId from the argument in the URL, not a hardcoded value', () => {
      const differentUnitId = 'unit-xyz-999';

      repository.updateUnitMediaKeys(differentUnitId, { mediaKeys: MEDIA_KEYS }).subscribe();

      const req = httpMock.expectOne(`${UNITS_BASE_URL}/${differentUnitId}`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });

    it('should send an empty mediaKeys array when provided', () => {
      repository.updateUnitMediaKeys(UNIT_ID, { mediaKeys: [] }).subscribe();

      const req = httpMock.expectOne(`${UNITS_BASE_URL}/${UNIT_ID}`);
      expect(req.request.body).toEqual({ mediaKeys: [] });
      req.flush(null);
    });

    it('should propagate HTTP 500 errors from the server', () => {
      return new Promise<void>((resolve) => {
        repository.updateUnitMediaKeys(UNIT_ID, { mediaKeys: MEDIA_KEYS }).subscribe({
          error: (err) => {
            expect(err.status).toBe(500);
            resolve();
          },
        });

        const req = httpMock.expectOne(`${UNITS_BASE_URL}/${UNIT_ID}`);
        req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
      });
    });

    it('should propagate HTTP 401 Unauthorized errors from the server', () => {
      return new Promise<void>((resolve) => {
        repository.updateUnitMediaKeys(UNIT_ID, { mediaKeys: MEDIA_KEYS }).subscribe({
          error: (err) => {
            expect(err.status).toBe(401);
            resolve();
          },
        });

        const req = httpMock.expectOne(`${UNITS_BASE_URL}/${UNIT_ID}`);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      });
    });

    it('should propagate HTTP 404 Not Found errors when the unit does not exist', () => {
      return new Promise<void>((resolve) => {
        repository.updateUnitMediaKeys(UNIT_ID, { mediaKeys: MEDIA_KEYS }).subscribe({
          error: (err) => {
            expect(err.status).toBe(404);
            resolve();
          },
        });

        const req = httpMock.expectOne(`${UNITS_BASE_URL}/${UNIT_ID}`);
        req.flush({ message: 'Unit not found' }, { status: 404, statusText: 'Not Found' });
      });
    });
  });
});
