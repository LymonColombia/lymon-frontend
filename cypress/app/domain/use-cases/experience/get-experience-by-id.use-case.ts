import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Experience } from '@/domain/entities/experience.model';
import { ExperienceRepository } from '@/domain/repositories/experience.repository';

@Injectable({ providedIn: 'root' })
export class GetExperienceByIdUseCase {
  private readonly repository = inject(ExperienceRepository);

  execute(id: string): Observable<Experience | null> {
    return this.repository.getExperienceById(id).pipe(
      map((response) => {
        const data = response.data;
        if (this.isExperience(data)) {
          return data;
        }

        return data.experience ?? null;
      }),
    );
  }

  private isExperience(value: unknown): value is Experience {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return 'scope' in value && 'name' in value;
  }
}

