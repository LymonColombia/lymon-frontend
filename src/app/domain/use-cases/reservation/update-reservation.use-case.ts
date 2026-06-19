import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';
import { Reservation } from '@/domain/entities/reservation.model';

export interface UpdateReservationInput {
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class UpdateReservationUseCase {
  private readonly repository = inject(ReservationRepository);

  execute(reservationId: string, input: UpdateReservationInput): Observable<Reservation> {
    return this.repository.update(reservationId, input);
  }
}
