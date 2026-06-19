import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantGuestRepository } from '@/domain/repositories/tenant-guest.repository';
import { CreateTenantGuestResponse } from '@/domain/entities/tenant-guest.model';

export interface CreateTenantGuestInput {
  fullName: string;
  primaryEmail: string;
}

@Injectable({ providedIn: 'root' })
export class CreateTenantGuestUseCase {
  private readonly tenantGuestRepository = inject(TenantGuestRepository);

  execute(input: CreateTenantGuestInput): Observable<CreateTenantGuestResponse> {
    return this.tenantGuestRepository.createGuest({
      fullName: input.fullName,
      primaryEmail: input.primaryEmail,
      identity: null,
      firstName: '',
      lastName: '',
      emails: [],
      phones: [],
      tags: [],
      preferences: [],
    });
  }
}
