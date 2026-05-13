import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PropertyRepository } from '@/domain/repositories/property.repository';

@Injectable({ providedIn: 'root' })
export class DeletePropertyUseCase {
  private readonly propertyRepository = inject(PropertyRepository);

  execute(id: string): Observable<unknown> {
    return this.propertyRepository.deleteProperty(id);
  }
}
