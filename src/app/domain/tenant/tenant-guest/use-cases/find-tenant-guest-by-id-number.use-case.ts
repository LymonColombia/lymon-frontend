import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantGuestRepository } from '@/domain/tenant/tenant-guest/tenant-guest.repository';
import { TenantGuest } from '@/domain/tenant/tenant-guest/tenant-guest.model';

@Injectable({ providedIn: 'root' })
export class FindTenantGuestByIdNumberUseCase {
  private readonly tenantGuestRepository = inject(TenantGuestRepository);

  execute(idNumber: string): Observable<TenantGuest | null> {
    return this.tenantGuestRepository.findByIdNumber(idNumber);
  }
}
