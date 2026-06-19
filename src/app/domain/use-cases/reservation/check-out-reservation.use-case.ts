import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';

@Injectable({ providedIn: 'root' })
export class CheckOutReservationUseCase {
  private readonly repository = inject(ReservationRepository);

  execute(reservationId: string): Observable<void> {
    return this.repository.checkOut(reservationId);
  }
}
