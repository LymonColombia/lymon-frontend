import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantGuestRepository } from '@/domain/repositories/tenant-guest.repository';
import { TenantGuest } from '@/domain/entities/tenant-guest.model';

@Injectable({ providedIn: 'root' })
export class GetTenantGuestsUseCase {
  private readonly tenantGuestRepository = inject(TenantGuestRepository);

  execute(): Observable<TenantGuest[]> {
    return this.tenantGuestRepository.getGuests();
  }
}
