import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/shared/property/property.repository';
import { Unit } from '@/domain/shared/property/property.model';

@Injectable({ providedIn: 'root' })
export class GetUnitUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(unitId: string): Observable<Unit> {
    return this.propertyRepository.getUnitById(unitId);
  }
}
