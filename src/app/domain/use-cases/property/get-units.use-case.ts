import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { Unit } from '@/domain/entities/staff.model';

@Injectable({ providedIn: 'root' })
export class GetUnitsUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(propertyId: string): Observable<Unit[]> {
    return this.staffRepository.getUnits(propertyId).pipe(map((res) => res.data.units));
  }
}
