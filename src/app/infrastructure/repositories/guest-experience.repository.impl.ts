import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { GuestExperienceRepository } from '@/domain/repositories/guest-experience.repository';
import { GuestExperience, GuestExperiencePage, ResponseGetById } from '@/domain/entities/guest-experience.model';
import { GuestExperienceMapper } from '@/infrastructure/mappers/guest-experience.mapper';


@Injectable({ providedIn: 'root' })
export class GuestExperienceRepositoryImpl extends GuestExperienceRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${environment.guestExperiences.endpoint}`;

  getExperiences(params: { tenantId?: string; propertyId?: string; category?: string; page: number; limit: number }): Observable<GuestExperiencePage> {
    let queryParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.tenantId) {
      queryParams = queryParams.set('tenantId', params.tenantId);
    }

    if (params.category) {
      queryParams = queryParams.set('category', params.category);
    }

    if (params.propertyId) {
      queryParams = queryParams.set('propertyId', params.propertyId);
    }

    return this.http
      .get<GuestExperiencePage>(this.baseUrl, { params: queryParams })
      .pipe(map((dto) => GuestExperienceMapper.toPage(dto)));
  }


  getExperienceById(id: string): Observable<GuestExperience> {
    return this.http
      .get<ResponseGetById>(`${this.baseUrl}/${id}`)
      .pipe(map((dto) => GuestExperienceMapper.toDomain(dto.data)));
  }

  
}
