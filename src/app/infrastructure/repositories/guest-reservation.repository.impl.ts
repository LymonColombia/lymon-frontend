import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { GuestReservationRepository } from '@/domain/repositories/guest-reservation.repository';
import { GuestReservationRequest, GuestReservationResponse, GuestReservationsPage } from '@/domain/entities/guest-reservation.model';
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
    interface ApiResponse { data: GuestReservationResponse }
    return this.http
      .get<ApiResponse>(`${BASE_URL}/${id}`, { headers: this.authHeaders() })
      .pipe(map((res) => res.data));
  }

  getAll(params: { page?: number; limit?: number }): Observable<GuestReservationsPage> {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);

    interface ApiResponse {
      data: {
        items: GuestReservationResponse[];
        pagination: GuestReservationsPage['pagination'];
      };
    }

    return this.http
      .get<ApiResponse>(BASE_URL, { headers: this.authHeaders(), params: httpParams })
      .pipe(
        map((response) => ({
          reservations: response.data.items ?? [],
          pagination: response.data.pagination ?? { page: params.page ?? 1, limit: params.limit ?? 10, total: 0, totalPages: 0 },
        })),
      );
  }
}
