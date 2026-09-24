import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShiftRepository } from '@/domain/tenant/shift/shift.repository';
import { ShiftResponse, UpdateShiftDto } from '@/domain/tenant/shift/shift.model';

@Injectable({ providedIn: 'root' })
export class UpdateShiftUseCase {
  private readonly shiftRepository = inject(ShiftRepository);

  execute(id: string, data: UpdateShiftDto): Observable<ShiftResponse> {
    return this.shiftRepository.updateShift(id, data);
  }
}
