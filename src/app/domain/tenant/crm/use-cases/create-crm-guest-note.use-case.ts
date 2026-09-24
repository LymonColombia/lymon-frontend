import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { CreateCrmGuestNoteRequest } from '@/domain/tenant/crm/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class CreateCrmGuestNoteUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string, data: CreateCrmGuestNoteRequest): Observable<void> {
    return this.crmRepository.createGuestNote(guestId, data);
  }
}
