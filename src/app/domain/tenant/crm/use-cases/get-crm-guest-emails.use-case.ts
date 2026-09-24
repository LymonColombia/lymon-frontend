import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { CrmGuestEmail } from '@/domain/tenant/crm/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestEmailsUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string): Observable<CrmGuestEmail[]> {
    return this.crmRepository.getGuestEmails(guestId).pipe(map((res) => res.data));
  }
}
