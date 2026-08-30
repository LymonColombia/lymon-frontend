import { Observable } from 'rxjs';
import { GuestExperience, GuestExperiencePage } from '@/domain/guest/guest-experience/guest-experience.model';

export abstract class GuestExperienceRepository {
  abstract getExperiences(params: {
    tenantId?: string;
    propertyId?: string;
    category?: string;
    sortByPrice?: 'asc' | 'desc';
    page: number;
    limit: number;
  }): Observable<GuestExperiencePage>;

  abstract getExperienceById(id: string): Observable<GuestExperience>;
}
