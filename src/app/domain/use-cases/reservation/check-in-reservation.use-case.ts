import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';

@Injectable({ providedIn: 'root' })
export class CheckInReservationUseCase {
  private readonly repository = inject(ReservationRepository);

  execute(reservationId: string): Observable<void> {
    return this.repository.checkIn(reservationId);
  }
}
