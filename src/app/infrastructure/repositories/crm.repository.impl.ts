import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreateCrmGuestNoteRequest,
  GetCrmGuestBookingsResponse,
  GetCrmGuestEmailsResponse,
  GetCrmGuestNotesResponse,
  GetCrmGuestsResponse,
  SendCrmGuestMessageRequest,
} from '@/domain/entities/crm-guest.model';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { CrmMapper } from '@/infrastructure/mappers/crm.mapper';
import { CrmGuestBookingDto, CrmGuestDto, CrmGuestEmailDto, CrmGuestNoteDto } from '@/infrastructure/dtos/crm.dto';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.crm.endpoint}`;

@Injectable({ providedIn: 'root' })
export class CrmRepositoryImpl extends CrmRepository {
  private readonly http = inject(HttpClient);

  getGuests(): Observable<GetCrmGuestsResponse> {
    return this.http
      .get<{ data: CrmGuestDto[] }>(`${BASE_URL}${environment.crm.guestsEndpoint}`)
      .pipe(map((res) => ({ data: CrmMapper.toGuests(res.data) })));
  }

  getGuestBookings(guestId: string): Observable<GetCrmGuestBookingsResponse> {
    return this.http
      .get<{ data: CrmGuestBookingDto[] }>(`${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/bookings`)
      .pipe(map((res) => ({ data: CrmMapper.toGuestBookings(res.data) })));
  }

  getGuestNotes(guestId: string): Observable<GetCrmGuestNotesResponse> {
    return this.http
      .get<{ data: CrmGuestNoteDto[] }>(`${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes`)
      .pipe(map((res) => ({ data: CrmMapper.toGuestNotes(res.data) })));
  }

  createGuestNote(guestId: string, data: CreateCrmGuestNoteRequest): Observable<void> {
    return this.http.post<void>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes`,
      data,
    );
  }

  getGuestEmails(guestId: string): Observable<GetCrmGuestEmailsResponse> {
    return this.http
      .get<{ data: CrmGuestEmailDto[] }>(`${BASE_URL}/guests/${guestId}/emails`)
      .pipe(map((res) => ({ data: CrmMapper.toGuestEmails(res.data) })));
  }

  sendGuestMessage(guestId: string, data: SendCrmGuestMessageRequest): Observable<void> {
    return this.http.post<void>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/messages`,
      data,
    );
  }
}
