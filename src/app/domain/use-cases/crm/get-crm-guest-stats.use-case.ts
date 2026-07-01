import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { CrmGuestStats } from '@/domain/entities/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestStatsUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string): Observable<CrmGuestStats> {
    return this.crmRepository.getGuestStats(guestId).pipe(map((res) => res.data));
  }
}
