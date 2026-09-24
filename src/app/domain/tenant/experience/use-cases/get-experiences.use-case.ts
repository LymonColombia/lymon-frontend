import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Experience, ExperienceScope } from '@/domain/tenant/experience/experience.model';
import {
  ExperienceQueryParams,
  ExperienceRepository,
} from '@/domain/tenant/experience/experience.repository';

interface GetExperiencesParams extends ExperienceQueryParams {
  scope?: ExperienceScope;
}

@Injectable({ providedIn: 'root' })
export class GetExperiencesUseCase {
  private readonly repository = inject(ExperienceRepository);

  execute(params?: GetExperiencesParams): Observable<Experience[]> {
    return this.repository.getExperiences(params).pipe(
      map((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          return data;
        }

        return data.experiences ?? data.items ?? [];
      }),
    );
  }
}

