import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StaffRepository } from '@/domain/tenant/staff/staff.repository';
import { GetUnitRatingsParams, UnitRatingsResponse } from '@/domain/entities/property.model';

@Injectable({ providedIn: 'root' })
export class GetUnitRatingsUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(params: GetUnitRatingsParams): Observable<UnitRatingsResponse> {
    return this.staffRepository.getUnitRatings(params);
  }
}
