import { Observable } from 'rxjs';
import { GuestReservationRequest, GuestReservationResponse, GuestReservationsPage, OccupiedDateRange } from '../entities/guest-reservation.model';

export abstract class GuestReservationRepository {
  abstract create(request: GuestReservationRequest): Observable<GuestReservationResponse>;
  abstract getAll(params: { page?: number; limit?: number }): Observable<GuestReservationsPage>;
  abstract getById(id: string): Observable<GuestReservationResponse>;
  abstract getUnitCalendar(unitId: string, params?: { startDate?: string; endDate?: string }): Observable<OccupiedDateRange[]>;
}
