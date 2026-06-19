import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantRepository } from '@/domain/repositories/tenant.repository';
import {
  TenantProfileResponse,
  UpdateTenantProfileRequest,
  UpdateTenantProfileResponse,
} from '@/domain/entities/tenant.model';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.tenant.endpoint}`;

@Injectable({ providedIn: 'root' })
export class TenantRepositoryImpl extends TenantRepository {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<TenantProfileResponse> {
    return this.http.get<TenantProfileResponse>(`${BASE_URL}/profile`);
  }

  updateProfile(data: UpdateTenantProfileRequest): Observable<UpdateTenantProfileResponse> {
    return this.http.patch<UpdateTenantProfileResponse>(`${BASE_URL}/profile`, data);
  }
}
