import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { GetCrmGuestBookingOriginsUseCase } from './get-crm-guest-booking-origins.use-case';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { GetCrmGuestBookingOriginsResponse } from '@/domain/entities/crm-guest.model';

const MOCK_RESPONSE: GetCrmGuestBookingOriginsResponse = {
  data: {
    total: 3,
    sources: [
      { source: 'DIRECT', count: 2, percentage: 66.67 },
      { source: 'AIRBNB', count: 1, percentage: 33.33 },
    ],
  },
};

describe('GetCrmGuestBookingOriginsUseCase', () => {
  let useCase: GetCrmGuestBookingOriginsUseCase;
  let repositoryMock: { getGuestBookingOrigins: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      getGuestBookingOrigins: vi.fn().mockReturnValue(of(MOCK_RESPONSE)),
    };

    TestBed.configureTestingModule({
      providers: [
        GetCrmGuestBookingOriginsUseCase,
        { provide: CrmRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetCrmGuestBookingOriginsUseCase);
  });

  it('debe llamar al repositorio con el guestId correcto', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-abc').subscribe(() => {
        expect(repositoryMock.getGuestBookingOrigins).toHaveBeenCalledWith('guest-abc');
        expect(repositoryMock.getGuestBookingOrigins).toHaveBeenCalledTimes(1);
        resolve(true);
      });
    });
  });

  it('debe retornar el campo data sin el wrapper de respuesta', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-abc').subscribe((result) => {
        expect(result).toEqual(MOCK_RESPONSE.data);
        expect(result.total).toBe(3);
        expect(result.sources).toHaveLength(2);
        resolve(true);
      });
    });
  });

  it('debe retornar los campos source, count y percentage de cada origen', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-abc').subscribe((result) => {
        expect(result.sources[0]).toEqual({ source: 'DIRECT', count: 2, percentage: 66.67 });
        expect(result.sources[1]).toEqual({ source: 'AIRBNB', count: 1, percentage: 33.33 });
        resolve(true);
      });
    });
  });

  it('debe retornar total 0 y sources vacío cuando no hay orígenes', async () => {
    repositoryMock.getGuestBookingOrigins.mockReturnValue(
      of({ data: { total: 0, sources: [] } }),
    );

    return new Promise((resolve) => {
      useCase.execute('guest-xyz').subscribe((result) => {
        expect(result.total).toBe(0);
        expect(result.sources).toHaveLength(0);
        resolve(true);
      });
    });
  });

  it('debe propagar errores del repositorio', async () => {
    repositoryMock.getGuestBookingOrigins.mockReturnValue(
      throwError(() => new Error('Network error')),
    );

    return new Promise((resolve) => {
      useCase.execute('guest-abc').subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          resolve(true);
        },
      });
    });
  });
});
