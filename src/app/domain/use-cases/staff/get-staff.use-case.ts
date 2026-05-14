import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { StaffMember, StaffListResponse } from '@/domain/entities/staff.model';
import { StaffRepository } from '@/domain/repositories/staff.repository';

@Injectable({ providedIn: 'root' })
export class GetStaffUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(): Observable<StaffMember[]> {
    return this.staffRepository.getStaff().pipe(
      map((response) => this.extractStaff(response)),
    );
  }

  private extractStaff(payload: StaffListResponse | unknown[]): StaffMember[] {
    if (Array.isArray(payload)) return payload as StaffMember[];

    return payload.data || [];
  }
}
