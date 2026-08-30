import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StaffRepository } from '@/domain/tenant/staff/staff.repository';
import { GetUnitRatingsParams, PropertiesResponse, PublicUnitsParams, UnitRatingsResponse, UnitResponse, UnitsResponse } from '@/domain/shared/property/property.model';
import { InviteStaffDto, RolesResponse, StaffListResponse } from '@/domain/tenant/staff/staff.model';
import { TokenService } from '@/infrastructure/tenant/services/token.service';
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
    if (params.name) queryParams['name'] = params.name;
    if (params.startDate) queryParams['startDate'] = params.startDate;
    if (params.endDate) queryParams['endDate'] = params.endDate;
    if (params.minGuests !== undefined) queryParams['minGuests'] = String(params.minGuests);
    if (params.propertyId) queryParams['propertyId'] = params.propertyId;
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

  deleteStaff(id: string): Observable<unknown> {
    return this.http.delete<unknown>(`${USER_BASE}/${id}`, { headers: this.authHeaders });
  }

  getUnitRatings(params: GetUnitRatingsParams): Observable<UnitRatingsResponse> {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.sort !== undefined) queryParams['sort'] = params.sort;
    if (params.filterRate !== undefined) queryParams['filterRate'] = String(params.filterRate);
    return this.http.get<UnitRatingsResponse>(
      `${environment.apiUrl}${environment.units.endpoint}/${params.unitId}/ratings`,
      { params: queryParams },
    );
  }
}
