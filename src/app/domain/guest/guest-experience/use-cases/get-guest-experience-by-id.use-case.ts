import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuestExperienceRepository } from '@/domain/guest/guest-experience/guest-experience.repository';
import { GuestExperience } from '@/domain/guest/guest-experience/guest-experience.model';

@Injectable({ providedIn: 'root' })
export class GetGuestExperienceByIdUseCase {
  private readonly repository = inject(GuestExperienceRepository);

  execute(id: string): Observable<GuestExperience> {
    return this.repository.getExperienceById(id);
  }
}
