import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of } from 'rxjs';
import { vi } from 'vitest';

import { GetTenantProfileUseCase } from './get-tenant-profile.use-case';
import { TenantRepository } from '@/domain/repositories/tenant.repository';
import { TenantProfileResponse } from '@/domain/entities/tenant.model';

describe('GetTenantProfileUseCase', () => {
  let useCase: GetTenantProfileUseCase;
  let repositoryMock: { getProfile: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockProfile: TenantProfileResponse = {
      data: {
        name: 'Hotel Demo',
        email: 'hello@demo.com',
      },
    };

    repositoryMock = {
      getProfile: vi.fn().mockReturnValue(of(mockProfile)),
    };

    TestBed.configureTestingModule({
      providers: [
        GetTenantProfileUseCase,
        { provide: TenantRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(GetTenantProfileUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should fetch from repository and cache the profile', async () => {
    return new Promise((resolve) => {
      useCase.execute().subscribe((result) => {
        expect(result.data.name).toBe('Hotel Demo');
        expect(repositoryMock.getProfile).toHaveBeenCalledTimes(1);
        resolve(true);
      });
    });
  });

  it('should return cached profile without calling repository again', async () => {
    return new Promise((resolve) => {
      useCase.execute().subscribe(() => {
        useCase.execute().subscribe((result) => {
          expect(result.data.name).toBe('Hotel Demo');
          expect(repositoryMock.getProfile).toHaveBeenCalledTimes(1);
          resolve(true);
        });
      });
    });
  });

  it('should reuse in-flight request when there is an active request', async () => {
    const subject = new Subject<TenantProfileResponse>();
    repositoryMock.getProfile = vi.fn().mockReturnValue(subject.asObservable() as Observable<TenantProfileResponse>);

    const first$ = useCase.execute();
    const second$ = useCase.execute();

    expect(first$).toBe(second$);
    expect(repositoryMock.getProfile).toHaveBeenCalledTimes(1);

    return new Promise((resolve) => {
      let emissions = 0;

      first$.subscribe(() => {
        emissions += 1;
      });

      second$.subscribe(() => {
        emissions += 1;
        if (emissions === 2) {
          resolve(true);
        }
      });

      subject.next({ data: { name: 'Hotel Demo' } });
      subject.complete();
    });
  });

  it('should force refresh when forceRefresh is true', async () => {
    return new Promise((resolve) => {
      useCase.execute().subscribe(() => {
        useCase.execute(true).subscribe(() => {
          expect(repositoryMock.getProfile).toHaveBeenCalledTimes(2);
          resolve(true);
        });
      });
    });
  });

  it('should clear cache and request state on clearCache', async () => {
    return new Promise((resolve) => {
      useCase.execute().subscribe(() => {
        useCase.clearCache();

        useCase.execute().subscribe(() => {
          expect(repositoryMock.getProfile).toHaveBeenCalledTimes(2);
          resolve(true);
        });
      });
    });
  });
});
