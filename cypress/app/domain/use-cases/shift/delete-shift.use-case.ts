import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShiftRepository } from '@/domain/repositories/shift.repository';

@Injectable({ providedIn: 'root' })
export class DeleteShiftUseCase {
  private readonly shiftRepository = inject(ShiftRepository);

  execute(id: string): Observable<void> {
    return this.shiftRepository.deleteShift(id);
  }
}
