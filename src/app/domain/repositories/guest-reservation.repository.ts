import { Observable } from 'rxjs';
import { GuestReservationRequest, GuestReservationResponse, GuestReservationsPage } from '../entities/guest-reservation.model';

export abstract class GuestReservationRepository {
  abstract create(request: GuestReservationRequest): Observable<GuestReservationResponse>;
  abstract getAll(params: { page?: number; limit?: number }): Observable<GuestReservationsPage>;
  abstract getById(id: string): Observable<GuestReservationResponse>;
}
