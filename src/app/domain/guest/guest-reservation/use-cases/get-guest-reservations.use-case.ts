import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/guest/guest-reservation/guest-reservation.repository';
import { GetGuestReservationsParams, GuestReservationsPage } from '@/domain/guest/guest-reservation/guest-reservation.model';

@Injectable({ providedIn: 'root' })
export class GetGuestReservationsUseCase {
  private readonly repository = inject(GuestReservationRepository);

  execute(params: GetGuestReservationsParams = {}): Observable<GuestReservationsPage> {
    return this.repository.getAll(params);
  }
}
