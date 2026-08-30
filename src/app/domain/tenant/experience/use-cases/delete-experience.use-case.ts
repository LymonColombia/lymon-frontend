import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExperienceRepository } from '@/domain/tenant/experience/experience.repository';

@Injectable({ providedIn: 'root' })
export class DeleteExperienceUseCase {
  private readonly repository = inject(ExperienceRepository);

  execute(id: string): Observable<unknown> {
    return this.repository.deleteExperience(id);
  }
}

