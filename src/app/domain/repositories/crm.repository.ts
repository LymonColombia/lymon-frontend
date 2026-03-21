import { Observable } from 'rxjs';
import {
  GetCrmGuestBookingsResponse,
  GetCrmGuestsResponse,
} from '@/domain/entities/crm-guest.model';

export abstract class CrmRepository {
  abstract getGuests(): Observable<GetCrmGuestsResponse>;
  abstract getGuestBookings(guestId: string): Observable<GetCrmGuestBookingsResponse>;
}
