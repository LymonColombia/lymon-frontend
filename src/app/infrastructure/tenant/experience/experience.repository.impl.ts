import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';

import {
  CreateExperienceDto,
  ExperienceResponse,
  ExperiencesResponse,
  UpdateExperienceDto,
} from '@/domain/tenant/experience/experience.model';
import {
  ExperienceQueryParams,
  ExperienceRepository,
} from '@/domain/tenant/experience/experience.repository';
import { TokenService } from '@/infrastructure/tenant/services/token.service';

@Injectable({ providedIn: 'root' })
export class ExperienceRepositoryImpl extends ExperienceRepository {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);

  private get authHeaders(): HttpHeaders {
    const token = this.tokenService.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  getExperiences(params?: ExperienceQueryParams): Observable<ExperiencesResponse> {
    let queryParams = new HttpParams();
    if (params?.scope) {
      queryParams = queryParams.set('scope', params.scope);
    }
    if (params?.propertyId) {
      queryParams = queryParams.set('propertyId', params.propertyId);
    }

    return this.http.get<ExperiencesResponse>(`${environment.apiUrl}${environment.experiences.endpoint}`, {
      headers: this.authHeaders,
      params: queryParams,
    });
  }

  getExperienceById(id: string): Observable<ExperienceResponse> {
    return this.http.get<ExperienceResponse>(
      `${environment.apiUrl}${environment.experiences.endpoint}/${id}`,
      { headers: this.authHeaders },
    );
  }

  createExperience(data: CreateExperienceDto): Observable<unknown> {
    return this.http.post<unknown>(`${environment.apiUrl}${environment.experiences.endpoint}`, data, {
      headers: this.authHeaders,
    });
  }

  updateExperience(id: string, data: UpdateExperienceDto): Observable<unknown> {
    return this.http.patch<unknown>(`${environment.apiUrl}${environment.experiences.endpoint}/${id}`, data, {
      headers: this.authHeaders,
    });
  }

  deleteExperience(id: string): Observable<unknown> {
    return this.http.delete<unknown>(`${environment.apiUrl}${environment.experiences.endpoint}/${id}`, {
      headers: this.authHeaders,
    });
  }
}

