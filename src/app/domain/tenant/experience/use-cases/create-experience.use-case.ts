import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateExperienceDto } from '@/domain/tenant/experience/experience.model';
import { ExperienceRepository } from '@/domain/tenant/experience/experience.repository';

@Injectable({ providedIn: 'root' })
export class CreateExperienceUseCase {
  private readonly repository = inject(ExperienceRepository);

  execute(data: CreateExperienceDto): Observable<unknown> {
    return this.repository.createExperience(data);
  }
}

