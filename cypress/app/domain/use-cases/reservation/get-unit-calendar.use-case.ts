import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { OccupiedDateRange } from '@/domain/entities/guest-reservation.model';

@Injectable({ providedIn: 'root' })
export class GetUnitCalendarUseCase {
  private readonly guestReservationRepository = inject(GuestReservationRepository);

  execute(unitId: string, params?: { startDate?: string; endDate?: string }): Observable<OccupiedDateRange[]> {
    return this.guestReservationRepository.getUnitCalendar(unitId, params);
  }
}
