import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/shared/property/property.repository';
import { UpdateUnitDto } from '@/domain/shared/property/property.model';

@Injectable({ providedIn: 'root' })
export class UpdateUnitUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(id: string, data: UpdateUnitDto): Observable<unknown> {
    return this.propertyRepository.updateUnit(id, data);
  }
}
