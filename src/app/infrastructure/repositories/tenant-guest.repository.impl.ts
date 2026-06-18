import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TenantGuestRepository } from '@/domain/repositories/tenant-guest.repository';
import { CreateTenantGuestRequest, CreateTenantGuestResponse, TenantGuest, GetTenantGuestsResponse } from '@/domain/entities/tenant-guest.model';
import { environment } from '@env';

const GUESTS_URL = `${environment.apiUrl}${environment.guests.endpoint}`;

@Injectable({ providedIn: 'root' })
export class TenantGuestRepositoryImpl extends TenantGuestRepository {
  private readonly http = inject(HttpClient);

  createGuest(data: CreateTenantGuestRequest): Observable<CreateTenantGuestResponse> {
    return this.http
      .post<{ data: CreateTenantGuestResponse }>(GUESTS_URL, data)
      .pipe(map((res) => res.data));
  }

  getGuests(): Observable<TenantGuest[]> {
    return this.http
      .get<GetTenantGuestsResponse>(GUESTS_URL)
      .pipe(
        map((res) => res.data || [])
      );
  }
}
