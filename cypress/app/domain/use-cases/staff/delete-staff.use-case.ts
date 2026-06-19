import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StaffRepository } from '@/domain/repositories/staff.repository';

@Injectable({ providedIn: 'root' })
export class DeleteStaffUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(id: string): Observable<unknown> {
    return this.staffRepository.deleteStaff(id);
  }
}
