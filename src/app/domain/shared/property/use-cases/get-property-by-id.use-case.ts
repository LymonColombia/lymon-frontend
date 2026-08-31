import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/shared/property/property.repository';
import { PropertyDetail } from '@/domain/shared/property/property.model';

@Injectable({ providedIn: 'root' })
export class GetPropertyByIdUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(id: string): Observable<PropertyDetail> {
    return this.propertyRepository.getPropertyById(id);
  }
}
