import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/tenant/staff/staff.repository';
import { Unit } from '@/domain/entities/property.model';

@Injectable({ providedIn: 'root' })
export class GetPublicUnitUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(unitId: string): Observable<Unit> {
    return this.staffRepository.getPublicUnit(unitId).pipe(map((response) => response.data.unit));
  }
}
