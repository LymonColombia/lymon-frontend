import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/shared/property/property.repository';

@Injectable({ providedIn: 'root' })
export class DeleteUnitUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(id: string): Observable<unknown> {
    return this.propertyRepository.deleteUnit(id);
  }
}
