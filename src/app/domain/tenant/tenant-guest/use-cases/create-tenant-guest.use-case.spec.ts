import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CreateTenantGuestUseCase } from './create-tenant-guest.use-case';
import { TenantGuestRepository } from '@/domain/tenant/tenant-guest/tenant-guest.repository';
import { CreateTenantGuestResponse } from '@/domain/tenant/tenant-guest/tenant-guest.model';

describe('CreateTenantGuestUseCase', () => {
  let useCase: CreateTenantGuestUseCase;
  let repositoryMock: { createGuest: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockResponse: CreateTenantGuestResponse = {
      guestId: 'guest-1',
      fullName: 'Carlos Ruiz',
      primaryEmail: 'carlos@test.com',
    };

    repositoryMock = {
      createGuest: vi.fn().mockReturnValue(of(mockResponse)),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateTenantGuestUseCase,
        { provide: TenantGuestRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(CreateTenantGuestUseCase);
  });

  it('sends identity.documentNumber when idNumber is provided', () => {
    useCase
      .execute({ fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com', idNumber: '1020304050' })
      .subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ identity: { documentNumber: '1020304050' } }),
    );
  });

  it('trims idNumber before sending it', () => {
    useCase
      .execute({ fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com', idNumber: '  1020304050  ' })
      .subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ identity: { documentNumber: '1020304050' } }),
    );
  });

  it('sends identity: null when idNumber is missing', () => {
    useCase.execute({ fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com' }).subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ identity: null }),
    );
  });

  it('sends identity: null when idNumber is blank', () => {
    useCase
      .execute({ fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com', idNumber: '   ' })
      .subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ identity: null }),
    );
  });
});
