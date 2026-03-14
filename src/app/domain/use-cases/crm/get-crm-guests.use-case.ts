import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { CrmGuest } from '@/domain/entities/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestsUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(): Observable<CrmGuest[]> {
    return this.crmRepository.getGuests().pipe(map((res) => res.data));
  }
}
