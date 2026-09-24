import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { PaginatedReservations } from '@/domain/shared/reservation/reservation.repository';
import { ReservationRepository } from '@/domain/shared/reservation/reservation.repository';

@Injectable({
  providedIn: 'root',
})
export class GetReservationsUseCase {
  private readonly reservationRepository = inject(ReservationRepository);

  execute(params?: { page?: number; limit?: number; status?: string; tenantId?: string }): Observable<PaginatedReservations> {
    return this.reservationRepository.getReservations(params);
  }
}
