import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/guest/guest-reservation/guest-reservation.repository';
import { OccupiedDateRange } from '@/domain/guest/guest-reservation/guest-reservation.model';

@Injectable({ providedIn: 'root' })
export class GetUnitCalendarUseCase {
  private readonly guestReservationRepository = inject(GuestReservationRepository);

  execute(unitId: string, params?: { startDate?: string; endDate?: string }): Observable<OccupiedDateRange[]> {
    return this.guestReservationRepository.getUnitCalendar(unitId, params);
  }
}
