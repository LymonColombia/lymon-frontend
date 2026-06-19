import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { CrmGuestBookingOrigin } from '@/domain/entities/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestBookingOriginsUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string): Observable<{ total: number; sources: CrmGuestBookingOrigin[] }> {
    return this.crmRepository.getGuestBookingOrigins(guestId).pipe(map((res) => res.data));
  }
}
