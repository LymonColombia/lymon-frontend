import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { GetCrmGuestRatingsUseCase } from './get-crm-guest-ratings.use-case';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { GetCrmGuestRatingsResponse } from '@/domain/tenant/crm/crm-guest.model';

const MOCK_RESPONSE: GetCrmGuestRatingsResponse = {
  data: {
    items: [
      {
        id: 'rating-1',
        unitId: 'unit-1',
        unitName: 'Habitación presidencial',
        rate: 5,
        message: 'Muy bueno el lugar!',
        createdAt: '2026-05-15T20:27:25.662Z',
      },
    ],
    averageRating: 5,
    pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
  },
};

describe('GetCrmGuestRatingsUseCase', () => {
  let useCase: GetCrmGuestRatingsUseCase;
  let repositoryMock: { getGuestRatings: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      getGuestRatings: vi.fn().mockReturnValue(of(MOCK_RESPONSE)),
    };

    TestBed.configureTestingModule({
      providers: [
        GetCrmGuestRatingsUseCase,
        { provide: CrmRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetCrmGuestRatingsUseCase);
  });

  it('debe llamar al repositorio con el guestId correcto', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-123').subscribe(() => {
        expect(repositoryMock.getGuestRatings).toHaveBeenCalledWith('guest-123', undefined);
        expect(repositoryMock.getGuestRatings).toHaveBeenCalledTimes(1);
        resolve(true);
      });
    });
  });

  it('debe pasar los parámetros de paginación al repositorio', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-123', { page: 2, limit: 10 }).subscribe(() => {
        expect(repositoryMock.getGuestRatings).toHaveBeenCalledWith('guest-123', { page: 2, limit: 10 });
        resolve(true);
      });
    });
  });

  it('debe retornar los datos del response sin el wrapper', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-123').subscribe((result) => {
        expect(result).toEqual(MOCK_RESPONSE.data);
        expect(result.items).toHaveLength(1);
        expect(result.averageRating).toBe(5);
        expect(result.pagination.totalPages).toBe(1);
        resolve(true);
      });
    });
  });

  it('debe retornar lista vacía correctamente', async () => {
    repositoryMock.getGuestRatings.mockReturnValue(
      of({ data: { items: [], averageRating: 0, pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } } }),
    );

    return new Promise((resolve) => {
      useCase.execute('guest-456').subscribe((result) => {
        expect(result.items).toHaveLength(0);
        expect(result.averageRating).toBe(0);
        resolve(true);
      });
    });
  });

  it('debe propagar errores del repositorio', async () => {
    repositoryMock.getGuestRatings.mockReturnValue(throwError(() => new Error('Network error')));

    return new Promise((resolve) => {
      useCase.execute('guest-123').subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          resolve(true);
        },
      });
    });
  });
});
