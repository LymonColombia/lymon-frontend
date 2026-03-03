import { Observable } from 'rxjs';
import { InviteStaffDto, RolesResponse } from '@/domain/entities/staff.model';

export abstract class StaffRepository {
  abstract addStaff(data: InviteStaffDto): Observable<unknown>;
  abstract getRoles(): Observable<RolesResponse>;
}
