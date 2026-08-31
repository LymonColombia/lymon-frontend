import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from '@/domain/shared/reservation/reservation.model';
import { ReservationRepository } from '@/domain/shared/reservation/reservation.repository';

@Injectable({
  providedIn: 'root',
})
export class GetReservationByIdUseCase {
  private readonly reservationRepository = inject(ReservationRepository);

  execute(reservationId: string): Observable<Reservation> {
    return this.reservationRepository.getReservationById(reservationId);
  }
}
