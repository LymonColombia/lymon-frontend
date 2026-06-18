import { Observable } from 'rxjs';
import { CreateTenantGuestRequest, CreateTenantGuestResponse } from '@/domain/entities/tenant-guest.model';

export abstract class TenantGuestRepository {
  abstract createGuest(data: CreateTenantGuestRequest): Observable<CreateTenantGuestResponse>;
}
