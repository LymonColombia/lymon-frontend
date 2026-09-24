import { Observable, map } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReservationRepository, PaginatedReservations } from '@/domain/shared/reservation/reservation.repository';
import { Reservation } from '@/domain/shared/reservation/reservation.model';
import { CreateReservationInput } from '@/domain/shared/reservation/use-cases/create-reservation.use-case';
import { UpdateReservationInput } from '@/domain/shared/reservation/use-cases/update-reservation.use-case';
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

  getReservations(params?: { page?: number; limit?: number; status?: string; tenantId?: string }): Observable<PaginatedReservations> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.status != null && params.status.trim() !== '') {
      httpParams = httpParams.set('status', params.status.trim());
    }
    if (params?.tenantId != null && params.tenantId.trim() !== '') {
      httpParams = httpParams.set('tenantId', params.tenantId.trim());
    }

    return this.http
      .get<unknown>(`${this.baseUrl}${this.endpoint}`, { params: httpParams })
      .pipe(map((response) => this.toPaginatedReservations(response)));
  }

  getReservationById(reservationId: string): Observable<Reservation> {
    return this.http
      .get<unknown>(`${this.baseUrl}${this.endpoint}/${reservationId}`)
      .pipe(map((response) => this.toReservation(response)));
  }

  create(input: CreateReservationInput): Observable<Reservation> {
    return this.http
      .post<unknown>(`${this.baseUrl}${this.endpoint}`, input)
      .pipe(map((response) => this.toCreatedReservation(response, input)));
  }

  update(reservationId: string, input: UpdateReservationInput): Observable<Reservation> {
    return this.http
      .patch<unknown>(`${this.baseUrl}${this.endpoint}/${reservationId}`, input)
      .pipe(map((response) => this.toUpdatedReservation(response, reservationId, input)));
  }

  confirm(reservationId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}${this.endpoint}/${reservationId}/confirm`, {});
  }

  checkIn(reservationId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}${this.endpoint}/${reservationId}/check-in`, {});
  }

  checkOut(reservationId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}${this.endpoint}/${reservationId}/check-out`, {});
  }

  cancel(reservationId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}${this.endpoint}/${reservationId}/cancel`, {});
  }

  private toCreatedReservation(response: unknown, input: CreateReservationInput): Reservation {
    if (this.isReservation(response)) {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const envelope = response as {
        data?: unknown;
        reservation?: unknown;
        item?: unknown;
        reservationId?: unknown;
        message?: unknown;
      };

      if (this.isReservation(envelope.data)) {
        return envelope.data;
      }

      if (this.isReservation(envelope.reservation)) {
        return envelope.reservation;
      }

      if (this.isReservation(envelope.item)) {
        return envelope.item;
      }

      if (typeof envelope.reservationId === 'string') {
        return this.buildReservationFromInput(envelope.reservationId, input);
      }
    }

    return this.buildReservationFromInput('', input);
  }

  private toUpdatedReservation(response: unknown, reservationId: string, input: UpdateReservationInput): Reservation {
    if (this.isReservation(response)) {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const envelope = response as {
        data?: unknown;
        reservation?: unknown;
        item?: unknown;
        reservationId?: unknown;
        message?: unknown;
      };

      if (this.isReservation(envelope.data)) {
        return envelope.data;
      }

      if (this.isReservation(envelope.reservation)) {
        return envelope.reservation;
      }

      if (this.isReservation(envelope.item)) {
        return envelope.item;
      }

      if (typeof envelope.reservationId === 'string') {
        return this.buildReservationFromUpdate(envelope.reservationId, input);
      }
    }

    return this.buildReservationFromUpdate(reservationId, input);
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

  private toPaginatedReservations(response: unknown): { reservations: Reservation[]; total: number } {
    if (Array.isArray(response)) {
      const reservations = response.filter((item): item is Reservation => this.isReservation(item));
      return { reservations, total: reservations.length };
    }

    if (typeof response === 'object' && response !== null) {
      const envelope = response as {
        data?: unknown;
        items?: unknown;
        reservations?: unknown;
        results?: unknown;
        total?: unknown;
        totalItems?: unknown;
        pagination?: { total?: unknown };
      };

      const listCandidate = envelope.data ?? envelope.items ?? envelope.reservations ?? envelope.results;
      let total = 0;

      if (typeof envelope.total === 'number') {
        total = envelope.total;
      } else if (typeof envelope.totalItems === 'number') {
        total = envelope.totalItems;
      } else if (typeof envelope.pagination?.total === 'number') {
        total = envelope.pagination.total;
      }

      if (Array.isArray(listCandidate)) {
        const reservations = listCandidate.filter((item): item is Reservation => this.isReservation(item));
        if (total === 0) {
          total = reservations.length;
        }
        return { reservations, total };
      }
    }

    return { reservations: [], total: 0 };
  }

  private isReservation(value: unknown): value is Reservation {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Partial<Reservation>;
    return typeof candidate.id === 'string' && typeof candidate.guestId === 'string';
  }

  private buildReservationFromInput(id: string, input: CreateReservationInput): Reservation {
    return {
      id,
      tenantId: '',
      propertyId: input.propertyId,
      unitId: input.unitId,
      guestId: input.guestId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: 0,
      source: input.source,
      status: 'pending',
      guestsCount: input.guestsCount,
      pricePerNight: 0,
      totalPrice: 0,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private buildReservationFromUpdate(id: string, input: UpdateReservationInput): Reservation {
    return {
      id,
      tenantId: '',
      propertyId: '',
      unitId: '',
      guestId: '',
      checkIn: input.checkIn ?? '',
      checkOut: input.checkOut ?? '',
      nights: 0,
      source: '',
      status: 'pending',
      guestsCount: 0,
      pricePerNight: 0,
      totalPrice: 0,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
