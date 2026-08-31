import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ShiftRepository } from '@/domain/tenant/shift/shift.repository';
import { ShiftResponse } from '@/domain/tenant/shift/shift.model';

@Injectable({
  providedIn: 'root'
})
export class UnassignStaffFromShiftUseCase {
  private readonly shiftRepository = inject(ShiftRepository);

  execute(shiftId: string, staffMemberIds: string[]): Observable<ShiftResponse> {
    return this.shiftRepository.unassignStaff(shiftId, staffMemberIds);
  }
}
