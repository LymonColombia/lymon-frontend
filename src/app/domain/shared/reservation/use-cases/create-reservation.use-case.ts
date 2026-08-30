import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationRepository } from '@/domain/shared/reservation/reservation.repository';
import { Reservation } from '@/domain/shared/reservation/reservation.model';

export interface CreateReservationInput {
  propertyId: string;
  unitId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  source: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class CreateReservationUseCase {
  private readonly repository = inject(ReservationRepository);

  execute(input: CreateReservationInput): Observable<Reservation> {
    return this.repository.create(input);
  }
}
