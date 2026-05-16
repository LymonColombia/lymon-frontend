import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { UnitCalendarEntry } from '@/domain/entities/guest-reservation.model';

@Injectable({ providedIn: 'root' })
export class GetUnitCalendarUseCase {
  private readonly repository = inject(GuestReservationRepository);

  execute(unitId: string): Observable<UnitCalendarEntry[]> {
    return this.repository.getCalendar(unitId);
  }
}
