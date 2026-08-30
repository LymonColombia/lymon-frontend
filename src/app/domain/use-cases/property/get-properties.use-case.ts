import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/tenant/staff/staff.repository';
import { Property } from '@/domain/entities/property.model';

@Injectable({ providedIn: 'root' })
export class GetPropertiesUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(): Observable<Property[]> {
    return this.staffRepository.getProperties().pipe(map((res) => res.data));
  }
}
