import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/shared/property/property.repository';
import { CreatePropertyDto } from '@/domain/shared/property/property.model';

@Injectable({ providedIn: 'root' })
export class CreatePropertyUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(data: CreatePropertyDto): Observable<unknown> {
    return this.propertyRepository.createProperty(data);
  }
}
