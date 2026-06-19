import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { PaginatedReservations } from '@/domain/repositories/reservation.repository';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';

@Injectable({
  providedIn: 'root',
})
export class GetReservationsUseCase {
  private readonly reservationRepository = inject(ReservationRepository);

  execute(params?: { page?: number; limit?: number }): Observable<PaginatedReservations> {
    return this.reservationRepository.getReservations(params);
  }
}
