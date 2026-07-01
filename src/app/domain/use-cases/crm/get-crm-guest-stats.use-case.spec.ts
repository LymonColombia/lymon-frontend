import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { GetCrmGuestStatsUseCase } from './get-crm-guest-stats.use-case';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { GetCrmGuestStatsResponse } from '@/domain/entities/crm-guest.model';

const MOCK_RESPONSE: GetCrmGuestStatsResponse = {
  data: {
    monthlySpending: [{ year: 2026, month: 3, label: 'Mar 2026', totalSpend: 900000 }],
    bookingOrigins: {
      total: 11,
      sources: [{ source: 'DIRECT', count: 10, percentage: 91 }],
    },
  },
};

describe('GetCrmGuestStatsUseCase', () => {
  let useCase: GetCrmGuestStatsUseCase;
  let repositoryMock: { getGuestStats: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      getGuestStats: vi.fn().mockReturnValue(of(MOCK_RESPONSE)),
    };

    TestBed.configureTestingModule({
      providers: [GetCrmGuestStatsUseCase, { provide: CrmRepository, useValue: repositoryMock }],
    });

    useCase = TestBed.inject(GetCrmGuestStatsUseCase);
  });

  it('debe llamar al repositorio con el guestId correcto', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-abc').subscribe(() => {
        expect(repositoryMock.getGuestStats).toHaveBeenCalledWith('guest-abc');
        expect(repositoryMock.getGuestStats).toHaveBeenCalledTimes(1);
        resolve(true);
      });
    });
  });

  it('debe retornar el campo data sin el wrapper de respuesta', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-abc').subscribe((result) => {
        expect(result).toEqual(MOCK_RESPONSE.data);
        resolve(true);
      });
    });
  });

  it('debe retornar monthlySpending y bookingOrigins juntos en una sola llamada', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-abc').subscribe((result) => {
        expect(result.monthlySpending).toHaveLength(1);
        expect(result.monthlySpending[0]).toEqual({ year: 2026, month: 3, label: 'Mar 2026', totalSpend: 900000 });
        expect(result.bookingOrigins.total).toBe(11);
        expect(result.bookingOrigins.sources).toHaveLength(1);
        expect(result.bookingOrigins.sources[0]).toEqual({ source: 'DIRECT', count: 10, percentage: 91 });
        resolve(true);
      });
    });
  });

  it('debe retornar monthlySpending vacío y bookingOrigins en cero cuando no hay datos', async () => {
    repositoryMock.getGuestStats.mockReturnValue(
      of({ data: { monthlySpending: [], bookingOrigins: { total: 0, sources: [] } } }),
    );

    return new Promise((resolve) => {
      useCase.execute('guest-xyz').subscribe((result) => {
        expect(result.monthlySpending).toHaveLength(0);
        expect(result.bookingOrigins.total).toBe(0);
        expect(result.bookingOrigins.sources).toHaveLength(0);
        resolve(true);
      });
    });
  });

  it('debe propagar errores del repositorio', async () => {
    repositoryMock.getGuestStats.mockReturnValue(throwError(() => new Error('Network error')));

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
