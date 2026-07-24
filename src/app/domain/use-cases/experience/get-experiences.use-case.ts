import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ExperienceListData } from '@/domain/entities/experience.model';
import {
  ExperienceQueryParams,
  ExperienceRepository,
} from '@/domain/repositories/experience.repository';

export type GetExperiencesParams = ExperienceQueryParams;

@Injectable({ providedIn: 'root' })
export class GetExperiencesUseCase {
  private readonly repository = inject(ExperienceRepository);

  execute(params?: GetExperiencesParams): Observable<ExperienceListData> {
    return this.repository.getExperiences({
      page: params?.page ,
      limit: params?.limit,
      propertyId: params?.propertyId,
    }).pipe(map((response) => response.data));
  }
}

