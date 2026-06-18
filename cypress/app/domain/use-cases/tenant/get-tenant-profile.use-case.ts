import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { TenantRepository } from '@/domain/repositories/tenant.repository';
import { TenantProfileResponse } from '@/domain/entities/tenant.model';

@Injectable({ providedIn: 'root' })
export class GetTenantProfileUseCase {
  private readonly tenantRepository = inject(TenantRepository);
  private cachedProfile: TenantProfileResponse | null = null;
  private inFlightRequest$: Observable<TenantProfileResponse> | null = null;

  execute(forceRefresh = false): Observable<TenantProfileResponse> {
    if (!forceRefresh && this.cachedProfile) {
      return of(this.cachedProfile);
    }

    if (!forceRefresh && this.inFlightRequest$) {
      return this.inFlightRequest$;
    }

    const request$ = this.tenantRepository.getProfile().pipe(
      tap((profile) => {
        this.cachedProfile = profile;
      }),
      shareReplay(1),
      finalize(() => {
        this.inFlightRequest$ = null;
      }),
    );

    this.inFlightRequest$ = request$;
    return request$;
  }

  clearCache(): void {
    this.cachedProfile = null;
    this.inFlightRequest$ = null;
  }
}
