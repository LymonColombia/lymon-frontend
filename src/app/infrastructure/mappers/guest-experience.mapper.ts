import { AvailabilityType, ExperienceScope, GuestExperience, GuestExperiencePage } from '@/domain/entities/guest-experience.model';
import { GuestExperienceDto, GuestExperiencePageDto } from '@/infrastructure/dtos/guest-experience.dto';

export class GuestExperienceMapper {
  static toDomain(dto: GuestExperienceDto): GuestExperience {
    return {
      id: dto.id,
      tenantId: dto.tenantId,
      scope: dto.scope as ExperienceScope,
      propertyId: dto.propertyId ?? null,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      priceCop: dto.priceCop,
      durationHours: dto.durationHours,
      capacity: dto.capacity,
      coverImageUrl: dto.coverImageUrl,
      mediaUrls: dto.mediaUrls ?? [],
      location: {
        label: dto.location.label,
        address: dto.location.address,
        lat: dto.location.lat,
        lng: dto.location.lng,
      },
      availabilityType: dto.availabilityType as AvailabilityType,
      startAt: dto.startAt ?? null,
      endAt: dto.endAt ?? null,
      recurrence: dto.recurrence
        ? {
            daysOfWeek: (dto.recurrence as any).daysOfWeek,
            startTime: (dto.recurrence as any).startTime,
            endTime: (dto.recurrence as any).endTime,
          }
        : null,
      blackoutRanges: (dto.blackoutRanges as Array<{ startAt: string; endAt: string }>).map((range) => ({
        startAt: range.startAt,
        endAt: range.endAt,
      })),
      allowStandalonePurchase: dto.allowStandalonePurchase,
      allowReservationPurchase: dto.allowReservationPurchase,
      minNoticeHours: dto.minNoticeHours,
      purchaseCutoffHours: dto.purchaseCutoffHours,
    };
  }

  static toPage(dto: GuestExperiencePageDto): GuestExperiencePage {
    return {
      experiences: dto.experiences.map((exp) => GuestExperienceMapper.toDomain(exp)),
      total: dto.total,
      page: dto.page,
      limit: dto.limit,
      totalPages: dto.totalPages,
    };
  }
}
