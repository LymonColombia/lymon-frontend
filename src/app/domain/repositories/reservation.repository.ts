import { Observable } from 'rxjs';
import { Reservation } from '@/domain/entities/reservation.model';

export abstract class ReservationRepository {
  abstract getReservations(): Observable<Reservation[]>;
}
