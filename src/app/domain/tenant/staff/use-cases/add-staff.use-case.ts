import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StaffRepository } from '@/domain/tenant/staff/staff.repository';
import { InviteStaffDto } from '@/domain/tenant/staff/staff.model';

@Injectable({ providedIn: 'root' })
export class AddStaffUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(data: InviteStaffDto): Observable<unknown> {
    return this.staffRepository.addStaff(data);
  }
}
