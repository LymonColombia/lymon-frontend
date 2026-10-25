import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { GetTenantGuestsUseCase } from './get-tenant-guests.use-case';
import { TenantGuestRepository } from '@/domain/tenant/tenant-guest/tenant-guest.repository';
import { TenantGuest } from '@/domain/tenant/tenant-guest/tenant-guest.model';

describe('GetTenantGuestsUseCase', () => {
  let useCase: GetTenantGuestsUseCase;
  let repositoryMock: { getGuests: ReturnType<typeof vi.fn> };

  const mockGuests: TenantGuest[] = [
    { id: 'guest-1', fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com' },
    { id: 'guest-2', fullName: 'Ana Maria', primaryEmail: 'ana@test.com' },
  ];

  beforeEach(() => {
    repositoryMock = {
      getGuests: vi.fn().mockReturnValue(of(mockGuests)),
    };

    TestBed.configureTestingModule({
      providers: [
        GetTenantGuestsUseCase,
        { provide: TenantGuestRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetTenantGuestsUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call getGuests on the repository and return guest list', () => {
    let result: TenantGuest[] | undefined;
    useCase.execute().subscribe((guests) => {
      result = guests;
    });

    expect(repositoryMock.getGuests).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockGuests);
  });

  it('should propagate errors from the repository', () => {
    const error = new Error('Failed to fetch guests');
    repositoryMock.getGuests.mockReturnValue(throwError(() => error));

    let receivedError: unknown;
    useCase.execute().subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    expect(receivedError).toBe(error);
  });
});
