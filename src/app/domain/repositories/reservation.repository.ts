import { Observable } from 'rxjs';
import { Reservation } from '@/domain/entities/reservation.model';
import type { CreateReservationInput } from '@/domain/use-cases/reservation/create-reservation.use-case';

export abstract class ReservationRepository {
  abstract getReservations(): Observable<Reservation[]>;
  abstract getReservationById(reservationId: string): Observable<Reservation>;
  abstract create(input: CreateReservationInput): Observable<Reservation>;
}
