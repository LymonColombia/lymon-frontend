import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { UpdateTenantProfileUseCase } from './update-tenant-profile.use-case';
import { TenantRepository } from '@/domain/repositories/tenant.repository';
import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';
import { UpdateTenantProfileRequest, UpdateTenantProfileResponse } from '@/domain/entities/tenant.model';

describe('UpdateTenantProfileUseCase', () => {
  let useCase: UpdateTenantProfileUseCase;
  let repositoryMock: { updateProfile: ReturnType<typeof vi.fn> };
  let getTenantProfileUseCaseMock: { clearCache: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockResponse: UpdateTenantProfileResponse = {
      message: 'updated',
      data: {
        name: 'Hotel Demo',
        contactPhone: '+123456789',
      },
    };

    repositoryMock = {
      updateProfile: vi.fn().mockReturnValue(of(mockResponse)),
    };

    getTenantProfileUseCaseMock = {
      clearCache: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateTenantProfileUseCase,
        { provide: TenantRepository, useValue: repositoryMock },
        { provide: GetTenantProfileUseCase, useValue: getTenantProfileUseCaseMock },
      ],
    });

    useCase = TestBed.inject(UpdateTenantProfileUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should update profile and clear cached tenant profile', async () => {
    const payload: UpdateTenantProfileRequest = {
      name: 'Hotel Demo',
      contactPhone: '+123456789',
    };

    return new Promise((resolve) => {
      useCase.execute(payload).subscribe((result) => {
        expect(result.message).toBe('updated');
        expect(repositoryMock.updateProfile).toHaveBeenCalledWith(payload);
        expect(repositoryMock.updateProfile).toHaveBeenCalledTimes(1);
        expect(getTenantProfileUseCaseMock.clearCache).toHaveBeenCalledTimes(1);
        resolve(true);
      });
    });
  });

  it('should propagate repository errors and not clear cache', async () => {
    repositoryMock.updateProfile = vi.fn().mockReturnValue(throwError(() => new Error('Network error')));

    const payload: UpdateTenantProfileRequest = {
      name: 'Hotel Demo',
    };

    return new Promise((resolve) => {
      useCase.execute(payload).subscribe({
        error: (error) => {
          expect(error.message).toBe('Network error');
          expect(getTenantProfileUseCaseMock.clearCache).not.toHaveBeenCalled();
          resolve(true);
        },
      });
    });
  });
});
