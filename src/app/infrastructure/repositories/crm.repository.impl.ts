import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreateCrmGuestNoteRequest,
  CrmGuestBooking,
  CrmGuestBookingSource,
  CrmGuestBookingStatus,
  CrmGuest,
  CrmGuestNote,
  CrmGuestNoteCategory,
  CrmGuestNoteStatus,
  CrmGuestStatus,
  GetCrmGuestBookingsResponse,
  GetCrmGuestNotesResponse,
  GetCrmGuestsResponse,
} from '@/domain/entities/crm-guest.model';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { environment } from '@env';

interface CrmGuestDto {
  id?: string;
  _id?: string;
  guestId?: string;
  fullName?: string;
  primaryEmail?: string;
  phones?: Array<{
    number?: string;
    isPrimary?: boolean;
  }>;
  status?: string;
  tags?: string[];
}

interface GetCrmGuestsApiEnvelope {
  data?: CrmGuestDto[];
  items?: CrmGuestDto[];
  guests?: CrmGuestDto[];
  results?: CrmGuestDto[];
}

interface CrmGuestBookingDto {
  id?: string;
  _id?: string;
  guestId?: string;
  property?:
    | string
    | {
        id?: string;
        _id?: string;
        name?: string;
        title?: string;
      };
  propertyName?: string;
  unit?:
    | string
    | {
        id?: string;
        _id?: string;
        name?: string;
        title?: string;
        unitName?: string;
      };
  unitName?: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
  totalAmount?: number;
  source?: string;
  createdAt?: string;
}

interface GetCrmGuestBookingsApiEnvelope {
  data?: CrmGuestBookingDto[];
  items?: CrmGuestBookingDto[];
  bookings?: CrmGuestBookingDto[];
  results?: CrmGuestBookingDto[];
}

interface CrmGuestNoteDto {
  id?: string;
  _id?: string;
  note?: string;
  content?: string;
  description?: string;
  type?: string;
  category?: string;
  status?: string;
  createdAt?: string;
  createdBy?: string | { name?: string; fullName?: string; firstName?: string; lastName?: string };
  author?: string | { name?: string; fullName?: string; firstName?: string; lastName?: string };
  user?: string | { name?: string; fullName?: string; firstName?: string; lastName?: string };
}

interface GetCrmGuestNotesApiEnvelope {
  data?: CrmGuestNoteDto[];
  items?: CrmGuestNoteDto[];
  notes?: CrmGuestNoteDto[];
  results?: CrmGuestNoteDto[];
}

const BASE_URL = `${environment.apiUrl}${environment.crm.endpoint}`;

@Injectable({ providedIn: 'root' })
export class CrmRepositoryImpl extends CrmRepository {
  private readonly http = inject(HttpClient);

  getGuests(): Observable<GetCrmGuestsResponse> {
    return this.http.get<unknown>(`${BASE_URL}${environment.crm.guestsEndpoint}`).pipe(
      map((response) => ({
        data: this.extractGuests(response).map((guest) => this.toDomainGuest(guest)),
      })),
    );
  }

  getGuestBookings(guestId: string): Observable<GetCrmGuestBookingsResponse> {
    return this.http
      .get<unknown>(`${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/bookings`)
      .pipe(
        map((response) => ({
          data: this.extractGuestBookings(response).map((booking) =>
            this.toDomainGuestBooking(booking),
          ),
        })),
      );
  }

  getGuestNotes(guestId: string): Observable<GetCrmGuestNotesResponse> {
    return this.http.get<unknown>(`${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes`).pipe(
      map((response) => ({
        data: this.extractGuestNotes(response).map((note) => this.toDomainGuestNote(note)),
      })),
    );
  }

  createGuestNote(guestId: string, data: CreateCrmGuestNoteRequest): Observable<unknown> {
    return this.http.post<unknown>(
      `${BASE_URL}${environment.crm.guestsEndpoint}/${guestId}/notes`,
      data,
    );
  }

  private extractGuests(response: unknown): CrmGuestDto[] {
    if (Array.isArray(response)) {
      return response as CrmGuestDto[];
    }

    if (typeof response === 'object' && response !== null) {
      const envelope = response as GetCrmGuestsApiEnvelope;
      if (Array.isArray(envelope.data)) return envelope.data;
      if (Array.isArray(envelope.items)) return envelope.items;
      if (Array.isArray(envelope.guests)) return envelope.guests;
      if (Array.isArray(envelope.results)) return envelope.results;
    }

    return [];
  }

  private toDomainGuest(dto: CrmGuestDto): CrmGuest {
    return {
      id: dto.id ?? dto._id ?? dto.guestId,
      name: dto.fullName ?? 'Sin nombre',
      email: dto.primaryEmail ?? '',
      phone: this.toPrimaryPhone(dto.phones),
      status: this.toStatus(dto.status),
      tags: dto.tags ?? [],
    };
  }

  private extractGuestBookings(response: unknown): CrmGuestBookingDto[] {
    if (Array.isArray(response)) {
      return response as CrmGuestBookingDto[];
    }

    if (typeof response === 'object' && response !== null) {
      const envelope = response as GetCrmGuestBookingsApiEnvelope;
      if (Array.isArray(envelope.data)) return envelope.data;
      if (Array.isArray(envelope.items)) return envelope.items;
      if (Array.isArray(envelope.bookings)) return envelope.bookings;
      if (Array.isArray(envelope.results)) return envelope.results;
    }

    return [];
  }

  private toDomainGuestBooking(dto: CrmGuestBookingDto): CrmGuestBooking {
    return {
      id: dto.id ?? dto._id ?? '',
      propertyId: this.getReferenceId(dto.property),
      propertyName: this.getPropertyName(dto),
      unitId: this.getReferenceId(dto.unit),
      unitName: this.getUnitName(dto),
      checkIn: dto.checkIn ?? '',
      checkOut: dto.checkOut ?? '',
      status: this.toBookingStatus(dto.status),
      totalAmount: typeof dto.totalAmount === 'number' ? dto.totalAmount : 0,
      source: this.toBookingSource(dto.source),
      createdAt: dto.createdAt ?? '',
    };
  }

  private extractGuestNotes(response: unknown): CrmGuestNoteDto[] {
    if (Array.isArray(response)) {
      return response as CrmGuestNoteDto[];
    }

    if (typeof response === 'object' && response !== null) {
      const envelope = response as GetCrmGuestNotesApiEnvelope;
      if (Array.isArray(envelope.data)) return envelope.data;
      if (Array.isArray(envelope.items)) return envelope.items;
      if (Array.isArray(envelope.notes)) return envelope.notes;
      if (Array.isArray(envelope.results)) return envelope.results;
    }

    return [];
  }

  private toDomainGuestNote(dto: CrmGuestNoteDto): CrmGuestNote {
    return {
      id: dto.id ?? dto._id ?? '',
      note: dto.note?.trim() || dto.content?.trim() || dto.description?.trim() || '',
      type: this.toGuestNoteCategory(dto.type ?? dto.category),
      status: this.toGuestNoteStatus(dto.status),
      createdAt: dto.createdAt ?? '',
      createdByName: this.getGuestNoteAuthor(dto),
    };
  }

  private getReferenceId(
    reference:
      | string
      | {
          id?: string;
          _id?: string;
        }
      | undefined,
  ): string {
    if (!reference) {
      return '';
    }

    if (typeof reference === 'string') {
      return reference;
    }

    return reference.id ?? reference._id ?? '';
  }

  private getPropertyName(dto: CrmGuestBookingDto): string {
    if (dto.propertyName?.trim()) {
      return dto.propertyName.trim();
    }

    if (dto.property && typeof dto.property !== 'string') {
      return dto.property.name?.trim() || dto.property.title?.trim() || '';
    }

    return '';
  }

  private getUnitName(dto: CrmGuestBookingDto): string {
    if (dto.unitName?.trim()) {
      return dto.unitName.trim();
    }

    if (dto.unit && typeof dto.unit !== 'string') {
      return dto.unit.unitName?.trim() || dto.unit.name?.trim() || dto.unit.title?.trim() || '';
    }

    return '';
  }

  private getGuestNoteAuthor(dto: CrmGuestNoteDto): string {
    const author = dto.createdBy ?? dto.author ?? dto.user;

    if (!author) {
      return 'Admin';
    }

    if (typeof author === 'string') {
      return this.toSafeGuestNoteAuthorLabel(author);
    }

    const resolvedName =
      author.fullName?.trim() ||
      author.name?.trim() ||
      `${author.firstName?.trim() ?? ''} ${author.lastName?.trim() ?? ''}`.trim();

    return this.toSafeGuestNoteAuthorLabel(resolvedName);
  }

  private toSafeGuestNoteAuthorLabel(value: string | undefined): string {
    const normalizedValue = value?.trim() ?? '';
    if (!normalizedValue) {
      return 'Admin';
    }

    const looksLikeMongoId = /^[a-f0-9]{24}$/i.test(normalizedValue);
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        normalizedValue,
      );

    return looksLikeMongoId || looksLikeUuid ? 'Admin' : normalizedValue;
  }

  private toGuestNoteCategory(value: string | undefined): CrmGuestNoteCategory {
    switch (value?.toLowerCase()) {
      case 'preference':
        return 'preference';
      case 'behavior':
        return 'behavior';
      case 'incident':
        return 'incident';
      default:
        return 'general';
    }
  }

  private toGuestNoteStatus(value: string | undefined): CrmGuestNoteStatus {
    return value?.toLowerCase() === 'pinned' ? 'pinned' : 'not_pinned';
  }

  private toPrimaryPhone(phones: CrmGuestDto['phones']): string {
    if (!phones || phones.length === 0) {
      return '';
    }

    const primaryPhone = phones.find((phone) => phone.isPrimary);
    return primaryPhone?.number ?? phones[0].number ?? '';
  }

  private toStatus(status: string | undefined): CrmGuestStatus {
    return status?.toLowerCase() === 'inactive' ? 'inactive' : 'active';
  }

  private toBookingStatus(status: string | undefined): CrmGuestBookingStatus {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'CONFIRMED';
      case 'CHECKED_IN':
        return 'CHECKED_IN';
      case 'CHECKED_OUT':
        return 'CHECKED_OUT';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'NO_SHOW':
        return 'NO_SHOW';
      default:
        return 'PENDING';
    }
  }

  private toBookingSource(source: string | undefined): CrmGuestBookingSource {
    switch (source?.toUpperCase()) {
      case 'DIRECT':
        return 'DIRECT';
      case 'AIRBNB':
        return 'AIRBNB';
      case 'BOOKING':
        return 'BOOKING';
      case 'VRBO':
        return 'VRBO';
      default:
        return 'MANUAL';
    }
  }
}
