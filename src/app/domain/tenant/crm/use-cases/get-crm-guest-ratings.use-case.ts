import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { CrmGuestRating, GetCrmGuestRatingsParams } from '@/domain/tenant/crm/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class GetCrmGuestRatingsUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(
    guestId: string,
    params?: GetCrmGuestRatingsParams,
  ): Observable<{
    items: CrmGuestRating[];
    averageRating: number;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.crmRepository.getGuestRatings(guestId, params).pipe(map((res) => res.data));
  }
}
