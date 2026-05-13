import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  CreateExperienceDto,
  Experience,
  ExperienceScope,
  UpdateExperienceDto,
} from '@/domain/entities/experience.model';
import {
  LOCAL_EXPERIENCES,
  LOCAL_PROPERTY_OPTIONS,
  LOCAL_UNIT_OPTIONS_BY_PROPERTY,
} from './utils/experience-local-data';
import { SelectOption } from '@/presentation/shared/components/select/select.component';

@Injectable({ providedIn: 'root' })
export class TenantExperienceLocalStoreService {
  private readonly experiences = signal<Experience[]>(LOCAL_EXPERIENCES);

  list(scope?: ExperienceScope): Observable<Experience[]> {
    const items = this.experiences();
    if (!scope) {
      return of(items);
    }

    return of(items.filter((item) => item.scope === scope));
  }

  getById(id: string): Observable<Experience | null> {
    return of(this.experiences().find((item) => item.id === id) ?? null);
  }

  create(dto: CreateExperienceDto): Observable<Experience> {
    const next: Experience = {
      ...dto,
      id: this.generateId(),
    } as Experience;
    this.experiences.update((current) => [next, ...current]);
    return of(next);
  }

  update(id: string, dto: UpdateExperienceDto): Observable<Experience | null> {
    let updated: Experience | null = null;

    this.experiences.update((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        updated = { ...item, ...dto } as Experience;
        return updated;
      }),
    );

    return of(updated);
  }

  getPropertyOptions(): SelectOption[] {
    return LOCAL_PROPERTY_OPTIONS;
  }

  getUnitOptions(propertyId: string): SelectOption[] {
    return LOCAL_UNIT_OPTIONS_BY_PROPERTY[propertyId] ?? [];
  }

  private generateId(): string {
    return `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

