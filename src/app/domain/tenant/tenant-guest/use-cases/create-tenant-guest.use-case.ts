import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantGuestRepository } from '@/domain/tenant/tenant-guest/tenant-guest.repository';
import { CreateTenantGuestResponse } from '@/domain/tenant/tenant-guest/tenant-guest.model';

export interface CreateTenantGuestInput {
  fullName: string;
  primaryEmail: string;
  idNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class CreateTenantGuestUseCase {
  private readonly tenantGuestRepository = inject(TenantGuestRepository);

  execute(input: CreateTenantGuestInput): Observable<CreateTenantGuestResponse> {
    const documentNumber = input.idNumber?.trim();

    return this.tenantGuestRepository.createGuest({
      fullName: input.fullName,
      primaryEmail: input.primaryEmail,
      identity: documentNumber ? { documentNumber } : null,
      firstName: '',
      lastName: '',
      tags: [],
      preferences: [],
    });
  }
}
