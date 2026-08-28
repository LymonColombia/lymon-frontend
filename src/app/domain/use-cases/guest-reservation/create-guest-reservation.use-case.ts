import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { GuestReservationRequest, GuestReservationResponse } from '@/domain/entities/guest-reservation.model';

@Injectable({ providedIn: 'root' })
export class CreateGuestReservationUseCase {
  private readonly repository = inject(GuestReservationRepository);

  execute(request: GuestReservationRequest): Observable<GuestReservationResponse> {
    return this.repository.create(request);
  }
}
