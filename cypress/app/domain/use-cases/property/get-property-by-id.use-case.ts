import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/repositories/property.repository';
import { PropertyDetail } from '@/domain/entities/property.model';

@Injectable({ providedIn: 'root' })
export class GetPropertyByIdUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(id: string): Observable<PropertyDetail> {
    return this.propertyRepository.getPropertyById(id);
  }
}
