import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { CreateUnitRatingDto, GetGuestReservationsParams, GuestReservationRequest, GuestReservationResponse, GuestReservationsPage, OccupiedDateRange } from '@/domain/entities/guest-reservation.model';
import { UnitCalendarDto } from '@/infrastructure/dtos/unit-calendar.dto';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';

const BASE_URL = `${environment.apiUrl}/guest/reservations`;

@Injectable({ providedIn: 'root' })
export class GuestReservationRepositoryImpl implements GuestReservationRepository {
  private readonly http = inject(HttpClient);
  private readonly guestTokenService = inject(GuestTokenService);

  private authHeaders(): HttpHeaders {
    const token = this.guestTokenService.getAccessToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  create(request: GuestReservationRequest): Observable<GuestReservationResponse> {
    return this.http.post<GuestReservationResponse>(BASE_URL, request, { headers: this.authHeaders() });
  }

  getById(id: string): Observable<GuestReservationResponse> {
    return this.http
      .get<GuestReservationResponse>(`${BASE_URL}/${id}`, { headers: this.authHeaders() })
      .pipe(map((res) => ({ ...res, status: res.status?.toLowerCase() ?? res.status })));
  }

  // Public endpoint — no auth required; guests can view availability before logging in
  getUnitCalendar(unitId: string, params?: { startDate?: string; endDate?: string }): Observable<OccupiedDateRange[]> {
    let httpParams = new HttpParams();
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);
    return this.http
      .get<UnitCalendarDto>(`${BASE_URL}/unit/${unitId}/calendar`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  createUnitRating(dto: CreateUnitRatingDto): Observable<unknown> {
    return this.http.post<unknown>(
      `${environment.apiUrl}/guest/unit-ratings`,
      dto,
      { headers: this.authHeaders() },
    );
  }

  getAll(params: GetGuestReservationsParams): Observable<GuestReservationsPage> {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    if (params.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params.toDate) httpParams = httpParams.set('toDate', params.toDate);

    interface ApiResponse {
      items: GuestReservationResponse[];
      total: number;
      page: number;
      limit: number;
    }

    return this.http
      .get<ApiResponse>(BASE_URL, { headers: this.authHeaders(), params: httpParams })
      .pipe(
        map((response) => ({
          reservations: (response.items ?? []).map((item) => ({
            ...item,
            status: item.status?.toLowerCase() ?? item.status,
          })),
          pagination: {
            page: response.page ?? params.page ?? 1,
            limit: response.limit ?? params.limit ?? 10,
            total: response.total ?? 0,
            totalPages: response.limit > 0 ? Math.max(1, Math.ceil((response.total ?? 0) / response.limit)) : 1,
          },
        })),
      );
  }
}
