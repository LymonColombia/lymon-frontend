import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { Unit } from '@/domain/entities/staff.model';

@Injectable({ providedIn: 'root' })
export class GetPublicUnitUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(unitId: string): Observable<Unit> {
    return this.staffRepository.getPublicUnit(unitId).pipe(map((response) => response.data.unit));
  }
}
