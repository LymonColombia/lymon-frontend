import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from '@/domain/entities/reservation.model';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';

@Injectable({
  providedIn: 'root',
})
export class GetReservationByIdUseCase {
  private readonly reservationRepository = inject(ReservationRepository);

  execute(reservationId: string): Observable<Reservation> {
    return this.reservationRepository.getReservationById(reservationId);
  }
}
