import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation } from '@/domain/entities/reservation.model';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';

@Injectable({
  providedIn: 'root',
})
export class GetReservationsUseCase {
  private readonly reservationRepository = inject(ReservationRepository);

  execute(): Observable<Reservation[]> {
    return this.reservationRepository.getReservations();
  }
}
