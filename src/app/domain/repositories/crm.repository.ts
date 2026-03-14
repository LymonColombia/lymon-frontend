import { Observable } from 'rxjs';
import { GetCrmGuestsResponse } from '@/domain/entities/crm-guest.model';

export abstract class CrmRepository {
  abstract getGuests(): Observable<GetCrmGuestsResponse>;
}
