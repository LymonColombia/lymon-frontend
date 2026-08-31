import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { UpdateCrmGuestNoteRequest } from '@/domain/tenant/crm/crm-guest.model';

@Injectable({ providedIn: 'root' })
export class UpdateCrmGuestNoteUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string, noteId: string, data: UpdateCrmGuestNoteRequest): Observable<void> {
    return this.crmRepository.updateGuestNote(guestId, noteId, data);
  }
}
