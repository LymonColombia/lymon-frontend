import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantRepository } from '@/domain/repositories/tenant.repository';
import {
  UpdateTenantProfileRequest,
  UpdateTenantProfileResponse,
} from '@/domain/entities/tenant.model';

@Injectable({ providedIn: 'root' })
export class UpdateTenantProfileUseCase {
  private readonly tenantRepository = inject(TenantRepository);

  execute(data: UpdateTenantProfileRequest): Observable<UpdateTenantProfileResponse> {
    return this.tenantRepository.updateProfile(data);
  }
}
