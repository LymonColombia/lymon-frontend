import { Observable } from 'rxjs';
import { CreateTenantGuestRequest, CreateTenantGuestResponse, TenantGuest } from '@/domain/tenant/tenant-guest/tenant-guest.model';

export abstract class TenantGuestRepository {
  abstract createGuest(data: CreateTenantGuestRequest): Observable<CreateTenantGuestResponse>;
  abstract getGuests(): Observable<TenantGuest[]>;
}
