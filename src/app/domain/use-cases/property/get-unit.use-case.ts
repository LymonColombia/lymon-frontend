import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/repositories/property.repository';
import { Unit } from '@/domain/entities/property.model';

@Injectable({ providedIn: 'root' })
export class GetUnitUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(unitId: string): Observable<Unit> {
    return this.propertyRepository.getUnitById(unitId);
  }
}
