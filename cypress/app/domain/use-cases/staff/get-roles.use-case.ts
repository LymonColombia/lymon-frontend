import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { Role } from '@/domain/entities/staff.model';

@Injectable({ providedIn: 'root' })
export class GetRolesUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(): Observable<Role[]> {
    return this.staffRepository.getRoles().pipe(map((res) => res.roles));
  }
}
