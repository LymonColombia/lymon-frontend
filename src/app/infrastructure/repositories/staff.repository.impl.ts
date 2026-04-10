import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import {
  InviteStaffDto,
  PropertiesResponse,
  PublicUnitsParams,
  RolesResponse,
  StaffListResponse,
  UnitResponse,
  UnitsResponse,
} from '@/domain/entities/staff.model';
import { TokenService } from '@/infrastructure/services/token.service';
import { environment } from '@env';

const USER_BASE = `${environment.apiUrl}${environment.user.endpoint}`;

@Injectable({ providedIn: 'root' })
export class StaffRepositoryImpl extends StaffRepository {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  private get authHeaders(): HttpHeaders {
    const token = this.tokenService.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  addStaff(data: InviteStaffDto): Observable<unknown> {
    return this.http.post<unknown>(`${USER_BASE}/add-staff`, data, { headers: this.authHeaders });
  }

  getRoles(): Observable<RolesResponse> {
    return this.http.get<RolesResponse>(`${environment.apiUrl}/roles`, {
      headers: this.authHeaders,
    });
  }

  getStaff(): Observable<StaffListResponse | unknown[]> {
    return this.http.get<StaffListResponse | unknown[]>(`${USER_BASE}/staff`, {
      headers: this.authHeaders,
    });
  }

  getProperties(): Observable<PropertiesResponse> {
    return this.http.get<PropertiesResponse>(
      `${environment.apiUrl}${environment.properties.endpoint}`,
      { headers: this.authHeaders },
    );
  }

  getUnits(propertyId: string): Observable<UnitsResponse> {
    return this.http.get<UnitsResponse>(
      `${environment.apiUrl}${environment.units.endpoint}/${propertyId}`,
      { headers: this.authHeaders },
    );
  }

  getPublicUnits(params: PublicUnitsParams): Observable<UnitsResponse> {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.checkIn) queryParams['checkIn'] = params.checkIn;
    if (params.checkOut) queryParams['checkOut'] = params.checkOut;
    if (params.guests) queryParams['guests'] = String(params.guests);
    return this.http.get<UnitsResponse>(
      `${environment.apiUrl}${environment.units.endpoint}/public`,
      { params: queryParams },
    );
  }

  getPublicUnit(unitId: string): Observable<UnitResponse> {
    return this.http.get<UnitResponse>(
      `${environment.apiUrl}${environment.units.endpoint}/public/unit/${unitId}`,
    );
  }
}
