import { Observable } from 'rxjs';
import {
  CreateExperienceDto,
  ExperienceResponse,
  ExperiencesResponse,
  UpdateExperienceDto,
} from '@/domain/entities/experience.model';

export interface ExperienceQueryParams {
  page?: number;
  limit?: number;
  propertyId?: string;
}

export abstract class ExperienceRepository {
  abstract getExperiences(params?: ExperienceQueryParams): Observable<ExperiencesResponse>;
  abstract getExperienceById(id: string): Observable<ExperienceResponse>;
  abstract createExperience(data: CreateExperienceDto): Observable<unknown>;
  abstract updateExperience(id: string, data: UpdateExperienceDto): Observable<unknown>;
  abstract deleteExperience(id: string): Observable<unknown>;
}

