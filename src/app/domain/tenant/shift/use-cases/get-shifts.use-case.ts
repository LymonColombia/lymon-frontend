import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShiftRepository } from '@/domain/tenant/shift/shift.repository';
import { ShiftResponse } from '@/domain/tenant/shift/shift.model';

@Injectable({ providedIn: 'root' })
export class GetShiftsUseCase {
  private readonly repository = inject(ShiftRepository);

  execute(propertyId?: string, startDate?: string, endDate?: string): Observable<ShiftResponse[]> {
    return this.repository.getShifts(propertyId, startDate, endDate);
  }
}
