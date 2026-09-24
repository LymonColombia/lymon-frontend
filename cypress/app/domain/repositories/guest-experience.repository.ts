import { Observable } from 'rxjs';
import { GuestExperiencePage } from '@/domain/entities/guest-experience.model';

export abstract class GuestExperienceRepository {
  abstract getExperiences(params: {
    tenantId?: string;
    propertyId?: string|null;
    category?: string|null;
    page: number;
    limit: number;
  }): Observable<GuestExperiencePage>;
}
