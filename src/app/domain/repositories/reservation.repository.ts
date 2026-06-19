import { Observable } from 'rxjs';
import { Reservation } from '@/domain/entities/reservation.model';
import type { CreateReservationInput } from '@/domain/use-cases/reservation/create-reservation.use-case';
import type { UpdateReservationInput } from '@/domain/use-cases/reservation/update-reservation.use-case';

export abstract class ReservationRepository {
  abstract getReservations(): Observable<Reservation[]>;
  abstract getReservationById(reservationId: string): Observable<Reservation>;
  abstract create(input: CreateReservationInput): Observable<Reservation>;
  abstract update(reservationId: string, input: UpdateReservationInput): Observable<Reservation>;
  abstract confirm(reservationId: string): Observable<void>;
  abstract checkIn(reservationId: string): Observable<void>;
  abstract checkOut(reservationId: string): Observable<void>;
  abstract cancel(reservationId: string): Observable<void>;
}
