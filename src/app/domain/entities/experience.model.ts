export type ExperienceScope = 'PROPERTY' | 'TENANT';
export type ExperienceAvailabilityType = 'DATE_RANGE' | 'RECURRING'| 'ONE_TIME';

export interface ExperienceLocation {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ExperienceRecurrence {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface BlackoutRange {
  startAt: string;
  endAt: string;
}

export interface BaseExperience {
  id?: string;
  scope: ExperienceScope;
  name: string;
  description: string;
  category: string;
  priceCop: number;
  durationHours: number;
  capacity: number;
  coverImageUrl: string;
  location: ExperienceLocation;
  availabilityType: ExperienceAvailabilityType;
  allowStandalonePurchase?: boolean;
  allowReservationPurchase?: boolean;
}

export interface Experience extends BaseExperience {
  propertyId?: string;
  unitIds?: string[];
  startAt?: string;
  endAt?: string;
  blackoutRanges?: BlackoutRange[];
  recurrence?: ExperienceRecurrence;
}

export type PropertyExperience = Experience & { scope: 'PROPERTY' };
export type TenantExperience = Experience & { scope: 'TENANT' };

export type CreateExperienceDto = Omit<Experience, 'id'>;
export type UpdateExperienceDto = Partial<Omit<Experience, 'id'>>;

export interface ExperiencesResponse {
  data:
    | Experience[]
    | {
        experiences?: Experience[];
        items?: Experience[];
      };
}

export interface ExperienceResponse {
  data:
    | Experience
    | {
        experience?: Experience;
      };
}
