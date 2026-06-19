import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { GuestExperienceRepository } from '@/domain/repositories/guest-experience.repository';
import { GuestExperiencePage } from '@/domain/entities/guest-experience.model';
import { GuestExperiencePageDto } from '@/infrastructure/dtos/guest-experience.dto';
import { GuestExperienceMapper } from '@/infrastructure/mappers/guest-experience.mapper';

@Injectable({ providedIn: 'root' })
export class GuestExperienceRepositoryImpl extends GuestExperienceRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${environment.guestExperiences.endpoint}`;

  getExperiences(params: { tenatId: string; propertyId: string; category: string;  page: number; limit: number }): Observable<GuestExperiencePage> {
    const queryParams = new HttpParams()
      .set('tenantId', params.tenatId)
      .set('propertyId', params.propertyId)
      .set('category', params.category)
      .set('page', params.page)
      .set('limit', params.limit);

    return this.http
      .get<GuestExperiencePageDto>(this.baseUrl, { params: queryParams })
      .pipe(map((dto) => GuestExperienceMapper.toPage(dto)));
  }
}
