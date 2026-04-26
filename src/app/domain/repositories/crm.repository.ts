import { Observable } from 'rxjs';
import {
  CreateCrmGuestNoteRequest,
  GetCrmGuestBookingsResponse,
  GetCrmGuestEmailsResponse,
  GetCrmGuestNotesResponse,
  GetCrmGuestsParams,
  GetCrmGuestsResponse,
  SendCrmGuestMessageRequest,
  UpdateCrmGuestNoteRequest,
} from '@/domain/entities/crm-guest.model';

export abstract class CrmRepository {
  abstract getGuests(params?: GetCrmGuestsParams): Observable<GetCrmGuestsResponse>;
  abstract getGuestBookings(guestId: string): Observable<GetCrmGuestBookingsResponse>;
  abstract getGuestNotes(guestId: string): Observable<GetCrmGuestNotesResponse>;
  abstract getGuestEmails(guestId: string): Observable<GetCrmGuestEmailsResponse>;
  abstract createGuestNote(guestId: string, data: CreateCrmGuestNoteRequest): Observable<void>;
  abstract updateGuestNote(guestId: string, noteId: string, data: UpdateCrmGuestNoteRequest): Observable<void>;
  abstract deleteGuestNote(guestId: string, noteId: string): Observable<void>;
  abstract pinGuestNote(guestId: string, noteId: string): Observable<void>;
  abstract sendGuestMessage(guestId: string, data: SendCrmGuestMessageRequest): Observable<void>;
}
