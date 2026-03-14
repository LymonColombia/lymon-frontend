import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { Unit } from '@/domain/entities/staff.model';

@Injectable({ providedIn: 'root' })
export class GetPublicUnitsUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(tenantId: string): Observable<Unit[]> {
    return this.staffRepository.getPublicUnits(tenantId).pipe(map((response) => response.data.units));
  }
}
