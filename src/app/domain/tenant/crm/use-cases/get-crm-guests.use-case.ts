import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { CrmGuest, GetCrmGuestsParams } from '@/domain/tenant/crm/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestsUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(params?: GetCrmGuestsParams): Observable<CrmGuest[]> {
    return this.crmRepository.getGuests(params).pipe(map((res) => res.data));
  }
}
