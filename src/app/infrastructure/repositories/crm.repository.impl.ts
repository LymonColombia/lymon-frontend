import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CrmGuestBooking,
  CrmGuestBookingSource,
  CrmGuestBookingStatus,
  CrmGuest,
  CrmGuestStatus,
  GetCrmGuestBookingsResponse,
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
