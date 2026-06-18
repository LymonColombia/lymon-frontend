import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/repositories/property.repository';

@Injectable({ providedIn: 'root' })
export class UpdateUnitMediaKeysUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(unitId: string, mediaKeys: string[]): Observable<unknown> {
    return this.propertyRepository.updateUnitMediaKeys(unitId, { mediaKeys });
  }
}
