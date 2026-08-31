import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationRepository } from '@/domain/shared/reservation/reservation.repository';

@Injectable({ providedIn: 'root' })
export class CancelReservationUseCase {
  private readonly repository = inject(ReservationRepository);

  execute(reservationId: string): Observable<void> {
    return this.repository.cancel(reservationId);
  }
}
