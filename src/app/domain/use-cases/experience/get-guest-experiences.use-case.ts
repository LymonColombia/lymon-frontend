import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestExperienceRepository } from '@/domain/repositories/guest-experience.repository';
import { GuestExperiencePage } from '@/domain/entities/guest-experience.model';

@Injectable({ providedIn: 'root' })
export class GetGuestExperiencesUseCase {
  private readonly repository = inject(GuestExperienceRepository);

  execute(params: { propertyId: string; page?: number; limit?: number }): Observable<GuestExperiencePage> {
    return this.repository.getExperiences({
      propertyId: params.propertyId,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    });
  }
}
