import { Observable } from 'rxjs';
import {
  TenantProfileResponse,
  UpdateTenantProfileRequest,
  UpdateTenantProfileResponse,
} from '@/domain/entities/tenant.model';

export abstract class TenantRepository {
  abstract getProfile(): Observable<TenantProfileResponse>;
  abstract updateProfile(data: UpdateTenantProfileRequest): Observable<UpdateTenantProfileResponse>;
}
