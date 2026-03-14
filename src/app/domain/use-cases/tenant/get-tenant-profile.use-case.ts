import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantRepository } from '@/domain/repositories/tenant.repository';
import { TenantProfileResponse } from '@/domain/entities/tenant.model';

@Injectable({ providedIn: 'root' })
export class GetTenantProfileUseCase {
  private readonly tenantRepository = inject(TenantRepository);

  execute(): Observable<TenantProfileResponse> {
    return this.tenantRepository.getProfile();
  }
}
