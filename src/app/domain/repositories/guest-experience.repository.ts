import { Observable } from 'rxjs';
import { GuestExperience, GuestExperiencePage } from '@/domain/entities/guest-experience.model';

export abstract class GuestExperienceRepository {
  abstract getExperiences(params: {
    tenantId?: string;
    propertyId?: string;
    category?: string;
    page: number;
    limit: number;
  }): Observable<GuestExperiencePage>;

  abstract getExperienceById(id: string): Observable<GuestExperience>;
}
