import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { GuestReservationsPage } from '@/domain/entities/guest-reservation.model';

@Injectable({ providedIn: 'root' })
export class GetGuestReservationsUseCase {
  private readonly repository = inject(GuestReservationRepository);

  execute(params: { page?: number; limit?: number } = {}): Observable<GuestReservationsPage> {
    return this.repository.getAll(params);
  }
}
