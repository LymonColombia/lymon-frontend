import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/repositories/property.repository';
import { CreateUnitDto } from '@/domain/entities/property.model';

@Injectable({ providedIn: 'root' })
export class CreateUnitUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(data: CreateUnitDto): Observable<unknown> {
    return this.propertyRepository.createUnit(data);
  }
}
