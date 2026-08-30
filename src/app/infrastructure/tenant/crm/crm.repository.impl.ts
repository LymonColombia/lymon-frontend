import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreateCrmGuestNoteRequest,
  GetCrmGuestBookingsResponse,
  GetCrmGuestEmailsResponse,
  GetCrmGuestNotesResponse,
  GetCrmGuestRatingsParams,
  GetCrmGuestRatingsResponse,
  GetCrmGuestsParams,
  GetCrmGuestsResponse,
  GetCrmGuestStatsResponse,
  SendCrmGuestMessageRequest,
  UpdateCrmGuestNoteRequest,
  UpdateCrmGuestTagsRequest,
} from '@/domain/tenant/crm/crm-guest.model';
import { CrmRepository } from '@/domain/tenant/crm/crm.repository';
import { CrmMapper } from '@/infrastructure/tenant/crm/crm.mapper';
import { CrmGuestBookingDto, CrmGuestDto, CrmGuestEmailDto, CrmGuestNoteDto, CrmGuestRatingsResponseDto, CrmGuestStatsDto, PaginatedResponseDto } from '@/infrastructure/tenant/crm/crm.dto';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.crm.endpoint}`;

@Injectable({ providedIn: 'root' })
export class CrmRepositoryImpl extends CrmRepository {
  private readonly http = inject(HttpClient);

  getGuests(params?: GetCrmGuestsParams): Observable<GetCrmGuestsResponse> {
    return this.http
      .get<{ data: PaginatedResponseDto<CrmGuestDto> }>(`${BASE_URL}${environment.crm.guestsEndpoint}`, {
        params: {
          ...(params?.sortBy && { sortBy: params.sortBy }),
          ...(params?.sortDirection && { sortDirection: params.sortDirection }),
        },
      })
      .pipe(map((res) => ({ data: CrmMapper.toGuests(res.data.items) })));
  }

  getGuestBookings(guestId: string): Observable<GetCrmGuestBookingsResponse> {
    return this.http
      .get<{ data: PaginatedResponseDto<CrmGuestBookingDto> }>(`${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/bookings`)
      .pipe(map((res) => ({ data: CrmMapper.toGuestBookings(res.data.items) })));
  }

  getGuestNotes(guestId: string): Observable<GetCrmGuestNotesResponse> {
    return this.http
      .get<{ data: PaginatedResponseDto<CrmGuestNoteDto> }>(`${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes`)
      .pipe(map((res) => ({ data: CrmMapper.toGuestNotes(res.data.items) })));
  }

  createGuestNote(guestId: string, data: CreateCrmGuestNoteRequest): Observable<void> {
    return this.http.post<void>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes`,
      data,
    );
  }

  updateGuestNote(guestId: string, noteId: string, data: UpdateCrmGuestNoteRequest): Observable<void> {
    return this.http.patch<void>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes/${noteId}`,
      data,
    );
  }

  deleteGuestNote(guestId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes/${noteId}`,
    );
  }

  pinGuestNote(guestId: string, noteId: string): Observable<void> {
    return this.http.patch<void>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes/${noteId}/pin`,
      {},
    );
  }

  getGuestEmails(guestId: string): Observable<GetCrmGuestEmailsResponse> {
    return this.http
      .get<{ data: PaginatedResponseDto<CrmGuestEmailDto> }>(`${BASE_URL}/guests/${guestId}/emails`)
      .pipe(map((res) => ({ data: CrmMapper.toGuestEmails(res.data.items) })));
  }

  sendGuestMessage(guestId: string, data: SendCrmGuestMessageRequest): Observable<void> {
    return this.http.post<void>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/messages`,
      data,
    );
  }

  updateGuestTags(guestId: string, data: UpdateCrmGuestTagsRequest): Observable<void> {
    return this.http.patch<void>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/tags`,
      data,
    );
  }

  getGuestStats(guestId: string): Observable<GetCrmGuestStatsResponse> {
    return this.http
      .get<{ data: CrmGuestStatsDto }>(`${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/stats`)
      .pipe(map((res) => ({ data: CrmMapper.toGuestStats(res.data) })));
  }

  getGuestRatings(guestId: string, params?: GetCrmGuestRatingsParams): Observable<GetCrmGuestRatingsResponse> {
    return this.http
      .get<{ data: CrmGuestRatingsResponseDto }>(`${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/ratings`, {
        params: {
          ...(params?.page && { page: params.page }),
          ...(params?.limit && { limit: params.limit }),
        },
      })
      .pipe(map((res) => ({ data: CrmMapper.toGuestRatings(res.data) })));
  }
}
