import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ShiftRepository } from '@/domain/repositories/shift.repository';
import { ShiftResponse } from '@/domain/entities/shift.model';

@Injectable({
  providedIn: 'root'
})
export class AssignStaffToShiftUseCase {
  private shiftRepository = inject(ShiftRepository);

  execute(shiftId: string, staffMemberIds: string[]): Observable<ShiftResponse> {
    return this.shiftRepository.assignStaff(shiftId, staffMemberIds);
  }
}
