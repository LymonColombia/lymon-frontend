import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReservationRepository } from '@/domain/repositories/reservation.repository';
import { Reservation } from '@/domain/entities/reservation.model';
import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class ReservationRepositoryImpl extends ReservationRepository {
  private readonly baseUrl = environment.apiUrl;
  private readonly endpoint = environment.reservations.endpoint;

  constructor(private http: HttpClient) {
    super();
  }

  getReservations(): Observable<Reservation[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}${this.endpoint}`)
      .pipe(map((response) => this.toReservations(response)));
  }

  getReservationById(reservationId: string): Observable<Reservation> {
    return this.http
      .get<unknown>(`${this.baseUrl}${this.endpoint}/${reservationId}`)
      .pipe(map((response) => this.toReservation(response)));
  }

  private toReservation(response: unknown): Reservation {
    if (this.isReservation(response)) {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const envelope = response as { data?: unknown; reservation?: unknown; item?: unknown };

      if (this.isReservation(envelope.data)) {
        return envelope.data;
      }

      if (this.isReservation(envelope.reservation)) {
        return envelope.reservation;
      }

      if (this.isReservation(envelope.item)) {
        return envelope.item;
      }
    }

    throw new Error('No se pudo normalizar la reservacion por ID');
  }

  private toReservations(response: unknown): Reservation[] {
    if (Array.isArray(response)) {
      return response.filter((item): item is Reservation => this.isReservation(item));
    }

    if (typeof response === 'object' && response !== null) {
      const envelope = response as {
        data?: unknown;
        items?: unknown;
        reservations?: unknown;
        results?: unknown;
      };

      const listCandidate = envelope.data ?? envelope.items ?? envelope.reservations ?? envelope.results;
      if (Array.isArray(listCandidate)) {
        return listCandidate.filter((item): item is Reservation => this.isReservation(item));
      }
    }

    return [];
  }

  private isReservation(value: unknown): value is Reservation {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Partial<Reservation>;
    return typeof candidate.id === 'string' && typeof candidate.guestId === 'string';
  }
}
