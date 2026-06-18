import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrmRepository } from '@/domain/repositories/crm.repository';

@Injectable({ providedIn: 'root' })
export class DeleteCrmGuestNoteUseCase {
  private readonly crmRepository = inject(CrmRepository);

  execute(guestId: string, noteId: string): Observable<void> {
    return this.crmRepository.deleteGuestNote(guestId, noteId);
  }
}
