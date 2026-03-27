import { Observable } from 'rxjs';
import {
  CreateCrmGuestNoteRequest,
  GetCrmGuestBookingsResponse,
  GetCrmGuestNotesResponse,
  GetCrmGuestsResponse,
} from '@/domain/entities/crm-guest.model';

export abstract class CrmRepository {
  abstract getGuests(): Observable<GetCrmGuestsResponse>;
  abstract getGuestBookings(guestId: string): Observable<GetCrmGuestBookingsResponse>;
  abstract getGuestNotes(guestId: string): Observable<GetCrmGuestNotesResponse>;
  abstract createGuestNote(guestId: string, data: CreateCrmGuestNoteRequest): Observable<void>;
}
