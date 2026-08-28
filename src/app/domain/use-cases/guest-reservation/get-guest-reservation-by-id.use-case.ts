import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationResponse } from '@/domain/entities/guest-reservation.model';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';

@Injectable({ providedIn: 'root' })
export class GetGuestReservationByIdUseCase {
  private readonly repository = inject(GuestReservationRepository);

  execute(id: string): Observable<GuestReservationResponse> {
    return this.repository.getById(id);
  }
}
