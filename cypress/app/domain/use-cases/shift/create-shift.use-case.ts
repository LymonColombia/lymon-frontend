import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShiftRepository } from '@/domain/repositories/shift.repository';
import { CreateShiftDto, ShiftResponse } from '@/domain/entities/shift.model';

@Injectable({ providedIn: 'root' })
export class CreateShiftUseCase {
  private readonly shiftRepository = inject(ShiftRepository);

  execute(data: CreateShiftDto): Observable<ShiftResponse> {
    return this.shiftRepository.createShift(data);
  }
}
