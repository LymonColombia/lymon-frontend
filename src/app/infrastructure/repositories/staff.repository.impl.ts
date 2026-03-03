import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { InviteStaffDto, RolesResponse } from '@/domain/entities/staff.model';
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
}
