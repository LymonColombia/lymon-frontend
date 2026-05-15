import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';

@Injectable({ providedIn: 'root' })
export class CancelReservationUseCase {
  private readonly guestReservationRepository = inject(GuestReservationRepository);

  execute(id: string): Observable<void> {
    return this.guestReservationRepository.cancel(id);
  }
}
