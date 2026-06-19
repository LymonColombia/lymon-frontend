import { Observable } from 'rxjs';
import type { Reservation } from '@/domain/entities/reservation.model';
import type { CreateReservationInput } from '@/domain/use-cases/reservation/create-reservation.use-case';
import type { UpdateReservationInput } from '@/domain/use-cases/reservation/update-reservation.use-case';

export interface PaginatedReservations {
  reservations: Reservation[];
  total: number;
}

export abstract class ReservationRepository {
  abstract getReservations(params?: { page?: number; limit?: number }): Observable<PaginatedReservations>;
  abstract getReservationById(reservationId: string): Observable<Reservation>;
  abstract create(input: CreateReservationInput): Observable<Reservation>;
  abstract update(reservationId: string, input: UpdateReservationInput): Observable<Reservation>;
  abstract confirm(reservationId: string): Observable<void>;
  abstract checkIn(reservationId: string): Observable<void>;
  abstract checkOut(reservationId: string): Observable<void>;
  abstract cancel(reservationId: string): Observable<void>;
}
