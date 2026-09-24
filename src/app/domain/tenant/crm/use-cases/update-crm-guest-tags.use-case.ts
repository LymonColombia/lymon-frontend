import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';

@Injectable({ providedIn: 'root' })
export class UpdateCrmGuestTagsUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string, tags: string[]): Observable<void> {
    return this.crmRepository.updateGuestTags(guestId, { tags });
  }
}
