import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { CrmGuestNote } from '@/domain/tenant/crm/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestNotesUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string): Observable<CrmGuestNote[]> {
    return this.crmRepository.getGuestNotes(guestId).pipe(map((res) => res.data));
  }
}
