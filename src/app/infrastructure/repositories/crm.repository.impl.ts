import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CrmGuest,
  CrmGuestStatus,
  GetCrmGuestsResponse,
} from '@/domain/entities/crm-guest.model';
import { CrmRepository } from '@/domain/repositories/crm.repository';
import { environment } from '@env';

interface CrmGuestDto {
  id?: string;
  _id?: string;
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
      id: dto.id ?? dto._id,
      name: dto.fullName ?? 'Sin nombre',
      email: dto.primaryEmail ?? '',
      phone: this.toPrimaryPhone(dto.phones),
      status: this.toStatus(dto.status),
      tags: dto.tags ?? [],
    };
  }

  private toPrimaryPhone(phones: CrmGuestDto['phones']): string {
    if (!phones || phones.length === 0) {
      return '';
    }

    const primaryPhone = phones.find((phone) => phone.isPrimary);
    return primaryPhone?.number ?? phones[0].number ?? '';
  }

  private toStatus(status: string | undefined): CrmGuestStatus {
    return status?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
  }
}
