import { Observable } from 'rxjs';
import { GuestExperiencePage } from '@/domain/entities/guest-experience.model';

export abstract class GuestExperienceRepository {
  abstract getExperiences(params: {
    propertyId: string;
    page: number;
    limit: number;
  }): Observable<GuestExperiencePage>;
}
