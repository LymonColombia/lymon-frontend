import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { CrmGuestBooking } from '@/domain/tenant/crm/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestBookingsUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string): Observable<CrmGuestBooking[]> {
    return this.crmRepository.getGuestBookings(guestId).pipe(map((res) => res.data));
  }
}
