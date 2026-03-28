import { Observable } from 'rxjs';
import {
  InviteStaffDto,
  PropertiesResponse,
  PublicUnitsParams,
  RolesResponse,
  StaffListResponse,
  UnitResponse,
  UnitsResponse,
} from '@/domain/entities/staff.model';

export abstract class StaffRepository {
  abstract addStaff(data: InviteStaffDto): Observable<unknown>;
  abstract getRoles(): Observable<RolesResponse>;
  abstract getStaff(): Observable<StaffListResponse | unknown[]>;
  abstract getProperties(): Observable<PropertiesResponse>;
  abstract getUnits(propertyId: string): Observable<UnitsResponse>;
  abstract getPublicUnits(params: PublicUnitsParams): Observable<UnitsResponse>;
  abstract getPublicUnit(unitId: string): Observable<UnitResponse>;
}
