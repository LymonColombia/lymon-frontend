import { Observable } from 'rxjs';
import { GetGuestReservationsParams, GuestReservationRequest, GuestReservationResponse, GuestReservationsPage } from '../entities/guest-reservation.model';

export abstract class GuestReservationRepository {
  abstract create(request: GuestReservationRequest): Observable<GuestReservationResponse>;
  abstract getAll(params: GetGuestReservationsParams): Observable<GuestReservationsPage>;
  abstract getById(id: string): Observable<GuestReservationResponse>;
}
