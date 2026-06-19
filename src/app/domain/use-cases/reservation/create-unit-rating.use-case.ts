import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { CreateUnitRatingDto } from '@/domain/entities/guest-reservation.model';

@Injectable({ providedIn: 'root' })
export class CreateUnitRatingUseCase {
  private readonly repository = inject(GuestReservationRepository);

  execute(dto: CreateUnitRatingDto): Observable<unknown> {
    return this.repository.createUnitRating(dto);
  }
}
