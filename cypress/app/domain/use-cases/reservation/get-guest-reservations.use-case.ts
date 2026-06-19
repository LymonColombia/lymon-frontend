import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { GetGuestReservationsParams, GuestReservationsPage } from '@/domain/entities/guest-reservation.model';

@Injectable({ providedIn: 'root' })
export class GetGuestReservationsUseCase {
  private readonly repository = inject(GuestReservationRepository);

  execute(params: GetGuestReservationsParams = {}): Observable<GuestReservationsPage> {
    return this.repository.getAll(params);
  }
}
