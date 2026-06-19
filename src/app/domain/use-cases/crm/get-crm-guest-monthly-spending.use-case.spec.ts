import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { GetCrmGuestMonthlySpendingUseCase } from './get-crm-guest-monthly-spending.use-case';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { GetCrmGuestMonthlySpendingResponse } from '@/domain/entities/crm-guest.model';

const MOCK_RESPONSE: GetCrmGuestMonthlySpendingResponse = {
  data: [
    { year: 2026, month: 1, label: 'Ene 2026', totalSpend: 350000 },
    { year: 2026, month: 2, label: 'Feb 2026', totalSpend: 120000 },
  ],
};

describe('GetCrmGuestMonthlySpendingUseCase', () => {
  let useCase: GetCrmGuestMonthlySpendingUseCase;
  let repositoryMock: { getGuestMonthlySpending: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      getGuestMonthlySpending: vi.fn().mockReturnValue(of(MOCK_RESPONSE)),
    };

    TestBed.configureTestingModule({
      providers: [
        GetCrmGuestMonthlySpendingUseCase,
        { provide: CrmRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetCrmGuestMonthlySpendingUseCase);
  });

  it('debe ser inyectable', () => {
    expect(useCase).toBeTruthy();
  });

  it('debe llamar al repositorio con el guestId correcto', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-123').subscribe(() => {
        expect(repositoryMock.getGuestMonthlySpending).toHaveBeenCalledWith('guest-123');
        expect(repositoryMock.getGuestMonthlySpending).toHaveBeenCalledTimes(1);
        resolve(true);
      });
    });
  });

  it('debe retornar el array data sin el wrapper de respuesta', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-123').subscribe((result) => {
        expect(result).toEqual(MOCK_RESPONSE.data);
        expect(result).toHaveLength(2);
        resolve(true);
      });
    });
  });

  it('debe mapear correctamente los campos de cada elemento', async () => {
    return new Promise((resolve) => {
      useCase.execute('guest-123').subscribe((result) => {
        expect(result[0]).toEqual({ year: 2026, month: 1, label: 'Ene 2026', totalSpend: 350000 });
        expect(result[1]).toEqual({ year: 2026, month: 2, label: 'Feb 2026', totalSpend: 120000 });
        resolve(true);
      });
    });
  });

  it('debe retornar array vacío cuando no hay datos de gasto mensual', async () => {
    repositoryMock.getGuestMonthlySpending.mockReturnValue(of({ data: [] }));

    return new Promise((resolve) => {
      useCase.execute('guest-456').subscribe((result) => {
        expect(result).toHaveLength(0);
        resolve(true);
      });
    });
  });

  it('debe propagar errores del repositorio', async () => {
    repositoryMock.getGuestMonthlySpending.mockReturnValue(
      throwError(() => new Error('Network error')),
    );

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
