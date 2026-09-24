import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { SendCrmGuestMessageRequest } from '@/domain/entities/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class SendCrmGuestMessageUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string, data: SendCrmGuestMessageRequest): Observable<void> {
    return this.crmRepository.sendGuestMessage(guestId, data);
  }
}
