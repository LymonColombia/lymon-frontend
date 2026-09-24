import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TenantRepository } from '@/domain/repositories/tenant.repository';
import {
  UpdateTenantProfileRequest,
  UpdateTenantProfileResponse,
} from '@/domain/entities/tenant.model';
import { GetTenantProfileUseCase } from '@/domain/use-cases/tenant/get-tenant-profile.use-case';

@Injectable({ providedIn: 'root' })
export class UpdateTenantProfileUseCase {
  private readonly tenantRepository = inject(TenantRepository);
  private readonly getTenantProfileUseCase = inject(GetTenantProfileUseCase);

  execute(data: UpdateTenantProfileRequest): Observable<UpdateTenantProfileResponse> {
    return this.tenantRepository.updateProfile(data).pipe(
      tap(() => {
        this.getTenantProfileUseCase.clearCache();
      }),
    );
  }
}
