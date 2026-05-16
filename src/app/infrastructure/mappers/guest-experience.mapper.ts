import { GuestExperience, GuestExperiencePage } from '@/domain/entities/guest-experience.model';
import { GuestExperienceDto, GuestExperiencePageDto } from '@/infrastructure/dtos/guest-experience.dto';

export class GuestExperienceMapper {
  static toDomain(dto: GuestExperienceDto): GuestExperience {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      priceCop: dto.priceCop,
      durationHours: dto.durationHours,
      capacity: dto.capacity,
      coverImageUrl: dto.coverImageUrl,
      location: {
        label: dto.location.label,
        address: dto.location.address,
      },
      allowReservationPurchase: dto.allowReservationPurchase,
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
