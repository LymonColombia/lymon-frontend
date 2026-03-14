import { Observable } from 'rxjs';
import {
  InviteStaffDto,
  PropertiesResponse,
  RolesResponse,
  UnitsResponse,
} from '@/domain/entities/staff.model';

export abstract class StaffRepository {
  abstract addStaff(data: InviteStaffDto): Observable<unknown>;
  abstract getRoles(): Observable<RolesResponse>;
  abstract getProperties(): Observable<PropertiesResponse>;
  abstract getUnits(propertyId: string): Observable<UnitsResponse>;
}
