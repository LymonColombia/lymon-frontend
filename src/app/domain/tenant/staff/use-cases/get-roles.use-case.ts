import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/tenant/staff/staff.repository';
import { Role } from '@/domain/tenant/staff/staff.model';

@Injectable({ providedIn: 'root' })
export class GetRolesUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(): Observable<Role[]> {
    return this.staffRepository.getRoles().pipe(map((res) => res.roles));
  }
}
