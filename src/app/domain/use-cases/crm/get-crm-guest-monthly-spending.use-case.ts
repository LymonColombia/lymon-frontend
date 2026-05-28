import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { CrmGuestMonthlySpend } from '@/domain/entities/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestMonthlySpendingUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string): Observable<CrmGuestMonthlySpend[]> {
    return this.crmRepository.getGuestMonthlySpending(guestId).pipe(map((res) => res.data));
  }
}
