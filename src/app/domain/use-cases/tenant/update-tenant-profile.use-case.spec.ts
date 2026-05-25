import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { assertIncludes } from '@/testing/assert';

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

describe('IA: actualiza perfil → Playwright: repositorio recibe payload exacto', () => {
  let useCase: UpdateTenantProfileUseCase;
  let repositoryMock: { updateProfile: ReturnType<typeof vi.fn> };
  let getTenantProfileUseCaseMock: { clearCache: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      updateProfile: vi.fn().mockReturnValue(of({
        message: 'updated',
        data: { name: 'Hotel Demo', contactPhone: '+123456789' },
      })),
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

  it('verifica que el repositorio recibe el payload exacto', async () => {
    const payload: UpdateTenantProfileRequest = {
      name: 'Hotel Demo',
      contactPhone: '+123456789',
    };

    return new Promise<void>((resolve) => {
      useCase.execute(payload).subscribe(() => {
        expect(repositoryMock.updateProfile).toHaveBeenCalledWith(payload);
        expect(repositoryMock.updateProfile).toHaveBeenCalledTimes(1);
        resolve();
      });
    });
  });
});

describe('IA: extrae respuesta exitosa → Playwright: message es "updated"', () => {
  let useCase: UpdateTenantProfileUseCase;
  let repositoryMock: { updateProfile: ReturnType<typeof vi.fn> };
  let getTenantProfileUseCaseMock: { clearCache: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      updateProfile: vi.fn().mockReturnValue(of({
        message: 'updated',
        data: { name: 'Hotel Demo', contactPhone: '+123456789' },
      })),
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

  it('verifica que la respuesta contiene message igual a "updated"', async () => {
    const payload: UpdateTenantProfileRequest = {
      name: 'Hotel Demo',
      contactPhone: '+123456789',
    };

    return new Promise<void>((resolve) => {
      useCase.execute(payload).subscribe((result) => {
        expect(result.message).toBe('updated');
        assertIncludes(result.message, 'updated', 'El mensaje de respuesta debe ser "updated"');
        resolve();
      });
    });
  });
});

describe('IA: observa limpieza de cache → Playwright: clearCache llamado exactamente una vez', () => {
  let useCase: UpdateTenantProfileUseCase;
  let repositoryMock: { updateProfile: ReturnType<typeof vi.fn> };
  let getTenantProfileUseCaseMock: { clearCache: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      updateProfile: vi.fn().mockReturnValue(of({
        message: 'updated',
        data: { name: 'Hotel Demo', contactPhone: '+123456789' },
      })),
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

  it('verifica que clearCache se invoca exactamente una vez tras éxito', async () => {
    const payload: UpdateTenantProfileRequest = {
      name: 'Hotel Demo',
      contactPhone: '+123456789',
    };

    return new Promise<void>((resolve) => {
      useCase.execute(payload).subscribe(() => {
        expect(getTenantProfileUseCaseMock.clearCache).toHaveBeenCalledTimes(1);
        resolve();
      });
    });
  });
});

describe('IA: extrae error de red → Playwright: error propagado y clearCache NO llamado', () => {
  let useCase: UpdateTenantProfileUseCase;
  let repositoryMock: { updateProfile: ReturnType<typeof vi.fn> };
  let getTenantProfileUseCaseMock: { clearCache: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repositoryMock = {
      updateProfile: vi.fn().mockReturnValue(throwError(() => new Error('Network error'))),
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

  it('verifica que el error se propaga y clearCache no se invoca', async () => {
    const payload: UpdateTenantProfileRequest = {
      name: 'Hotel Demo',
    };

    return new Promise<void>((resolve) => {
      useCase.execute(payload).subscribe({
        error: (err) => {
          expect(err.message).toBe('Network error');
          assertIncludes(err.message, 'Network error', 'El mensaje de error debe coincidir exactamente');
          expect(getTenantProfileUseCaseMock.clearCache).not.toHaveBeenCalled();
          resolve();
        },
      });
    });
  });
});
