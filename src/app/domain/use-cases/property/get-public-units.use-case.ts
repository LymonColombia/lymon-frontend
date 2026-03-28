import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { Pagination, PublicUnitsParams, Unit } from '@/domain/entities/staff.model';

export interface PublicUnitsPaginatedResult {
  units: Unit[];
  pagination: Pagination;
}

@Injectable({ providedIn: 'root' })
export class GetPublicUnitsUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(params: PublicUnitsParams): Observable<PublicUnitsPaginatedResult> {
    return this.staffRepository.getPublicUnits(params).pipe(
      map((response) => ({
        units: response.data.units,
        pagination: response.data.pagination ?? {
          total: 0,
          page: params.page,
          limit: params.limit,
          totalPages: 1,
        },
      })),
    );
  }
}
