import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UpdateExperienceDto } from '@/domain/entities/experience.model';
import { ExperienceRepository } from '@/domain/repositories/experience.repository';

@Injectable({ providedIn: 'root' })
export class UpdateExperienceUseCase {
  private readonly repository = inject(ExperienceRepository);

  execute(id: string, data: UpdateExperienceDto): Observable<unknown> {
    return this.repository.updateExperience(id, data);
  }
}

