import { Observable } from 'rxjs';
import { GetUnitRatingsParams, PropertiesResponse, PublicUnitsParams, UnitRatingsResponse, UnitResponse, UnitsResponse } from '@/domain/shared/property/property.model';
import { InviteStaffDto, RolesResponse, StaffListResponse } from '@/domain/tenant/staff/staff.model';

export abstract class StaffRepository {
  abstract addStaff(data: InviteStaffDto): Observable<unknown>;
  abstract getRoles(): Observable<RolesResponse>;
  abstract getStaff(): Observable<StaffListResponse | unknown[]>;
  abstract getProperties(): Observable<PropertiesResponse>;
  abstract getUnits(propertyId: string): Observable<UnitsResponse>;
  abstract getPublicUnits(params: PublicUnitsParams): Observable<UnitsResponse>;
  abstract getPublicUnit(unitId: string): Observable<UnitResponse>;
  abstract deleteStaff(id: string): Observable<unknown>;
  abstract getUnitRatings(params: GetUnitRatingsParams): Observable<UnitRatingsResponse>;
}
