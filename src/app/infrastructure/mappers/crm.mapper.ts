import {
  CrmGuest,
  CrmGuestBooking,
  CrmGuestBookingSource,
  CrmGuestBookingStatus,
  CrmGuestEmail,
  CrmGuestMonthlySpend,
  CrmGuestNote,
  CrmGuestNoteCategory,
  CrmGuestNoteStatus,
  CrmGuestStatus,
  GetCrmGuestBookingOriginsResponse,
  GetCrmGuestMonthlySpendingResponse,
  GetCrmGuestRatingsResponse,
} from '@/domain/entities/crm-guest.model';
import {
  CrmGuestBookingDto,
  CrmGuestBookingOriginsResponseDto,
  CrmGuestDto,
  CrmGuestEmailDto,
  CrmGuestMonthlySpendDto,
  CrmGuestNoteDto,
  CrmGuestRatingsResponseDto,
} from '@/infrastructure/dtos/crm.dto';

export class CrmMapper {
  static toGuests(dtos: CrmGuestDto[]): CrmGuest[] {
    return dtos.map((dto) => CrmMapper.toDomainGuest(dto));
  }

  static toGuestBookings(dtos: CrmGuestBookingDto[]): CrmGuestBooking[] {
    return dtos.map((dto) => CrmMapper.toDomainGuestBooking(dto));
  }

  static toGuestNotes(dtos: CrmGuestNoteDto[]): CrmGuestNote[] {
    return dtos.map((dto) => CrmMapper.toDomainGuestNote(dto));
  }

  static toGuestEmails(dtos: CrmGuestEmailDto[]): CrmGuestEmail[] {
    return dtos.map((dto) => ({
      id: dto.id,
      subject: dto.subject,
      status: dto.status,
      sentById: dto.sentById,
      createdAt: dto.createdAt,
    }));
  }

  static toGuestBookingOrigins(dto: CrmGuestBookingOriginsResponseDto): GetCrmGuestBookingOriginsResponse['data'] {
    return {
      total: dto.total,
      sources: dto.sources.map((s) => ({
        source: CrmMapper.toBookingSource(s.source),
        count: s.count,
        percentage: s.percentage,
      })),
    };
  }

  static toGuestMonthlySpending(dtos: CrmGuestMonthlySpendDto[]): GetCrmGuestMonthlySpendingResponse['data'] {
    return dtos.map((dto): CrmGuestMonthlySpend => ({
      year: dto.year,
      month: dto.month,
      label: dto.label,
      totalSpend: dto.totalSpend,
    }));
  }

  static toGuestRatings(dto: CrmGuestRatingsResponseDto): GetCrmGuestRatingsResponse['data'] {
    return {
      items: dto.items.map((item) => ({
        id: item.id,
        unitId: item.unitId,
        unitName: item.unitName,
        rate: item.rate,
        message: item.message,
        createdAt: item.createdAt,
      })),
      averageRating: dto.averageRating,
      pagination: dto.pagination,
    };
  }

  private static toDomainGuest(dto: CrmGuestDto): CrmGuest {
    return {
      id: dto.guestId,
      name: dto.fullName,
      email: dto.primaryEmail,
      phone: CrmMapper.toPrimaryPhone(dto.phones),
      status: CrmMapper.toGuestStatus(dto.status),
      tags: dto.tags,
    };
  }

  private static toDomainGuestBooking(dto: CrmGuestBookingDto): CrmGuestBooking {
    return {
      id: dto.id,
      propertyId: dto.propertyId,
      propertyName: dto.propertyName,
      unitId: dto.unitId,
      unitName: dto.unitName,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      status: CrmMapper.toBookingStatus(dto.status),
      totalAmount: dto.totalAmount,
      source: CrmMapper.toBookingSource(dto.source),
      createdAt: dto.createdAt,
    };
  }

  private static toDomainGuestNote(dto: CrmGuestNoteDto): CrmGuestNote {
    return {
      id: dto.id,
      note: dto.note,
      type: CrmMapper.toGuestNoteCategory(dto.type),
      status: CrmMapper.toGuestNoteStatus(dto.status),
      createdAt: dto.createdAt,
      createdByName: 'Admin',
    };
  }

  private static toGuestStatus(status: string): CrmGuestStatus {
    const normalized = status.toLowerCase();
    if (normalized === 'inactive') return 'inactive';
    if (normalized === 'blocked') return 'blocked';
    if (normalized === 'archived') return 'archived';
    return 'active';
  }

  private static toGuestNoteCategory(value: string): CrmGuestNoteCategory {
    switch (value.toLowerCase()) {
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

  private static toGuestNoteStatus(value: string): CrmGuestNoteStatus {
    return value.toLowerCase() === 'pinned' ? 'pinned' : 'not_pinned';
  }

  private static toPrimaryPhone(phones: CrmGuestDto['phones']): string {
    if (phones.length === 0) return '';
    const primaryPhone = phones.find((phone) => phone.isPrimary);
    return primaryPhone?.number ?? phones[0].number ?? '';
  }

  private static toBookingStatus(status: string): CrmGuestBookingStatus {
    switch (status.toUpperCase()) {
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

  private static toBookingSource(source: string): CrmGuestBookingSource {
    switch (source.toUpperCase()) {
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
