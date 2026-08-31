import { Observable } from 'rxjs';
import { CreateUnitRatingDto, GetGuestReservationsParams, GuestReservationRequest, GuestReservationResponse, GuestReservationsPage, OccupiedDateRange } from '@/domain/guest/guest-reservation/guest-reservation.model';

export abstract class GuestReservationRepository {
  abstract create(request: GuestReservationRequest): Observable<GuestReservationResponse>;
  abstract getAll(params: GetGuestReservationsParams): Observable<GuestReservationsPage>;
  abstract getById(id: string): Observable<GuestReservationResponse>;
  abstract getUnitCalendar(unitId: string, params?: { startDate?: string; endDate?: string }): Observable<OccupiedDateRange[]>;
  abstract createUnitRating(dto: CreateUnitRatingDto): Observable<unknown>;
}
