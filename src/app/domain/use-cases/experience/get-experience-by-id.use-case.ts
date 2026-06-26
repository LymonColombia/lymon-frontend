import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Experience } from '@/domain/entities/experience.model';
import { ExperienceRepository } from '@/domain/repositories/experience.repository';

@Injectable({ providedIn: 'root' })
export class GetExperienceByIdUseCase {
  private readonly repository = inject(ExperienceRepository);

  execute(id: string): Observable<Experience> {
    return this.repository.getExperienceById(id).pipe(map((response) => response.data));
  }
}

