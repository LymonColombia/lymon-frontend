import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/shared/property/property.repository';
import { UpdatePropertyDto } from '@/domain/shared/property/property.model';

@Injectable({ providedIn: 'root' })
export class UpdatePropertyUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(id: string, data: UpdatePropertyDto): Observable<unknown> {
    return this.propertyRepository.updateProperty(id, data);
  }
}
