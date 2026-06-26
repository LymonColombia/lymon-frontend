export interface ExperienceCard {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  priceFrom: number;
  hostCertified: boolean;
  category: string;
  categories: readonly string[];
  location: string;
  ownerType: string;
  ownerName: string;
  rating: number;
  reviewCount: number;
  duration: string;
  maxGuests: number;
  latitude: number;
  longitude: number;
}


export interface ExperienceDetail extends ExperienceCard {
  readonly summary: string;
  readonly capacity: string;
  readonly includes: readonly string[];
}

export interface ExperienceReservationDraft {
  readonly experienceId: string;
  readonly date: string;
  readonly guests: number;
  readonly total: number;
}
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

export interface ExperienceUnitSummary {
  id: string;
  name: string;
  maxGuests?: number;
  pricePerNight?: number;
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
  minimumParticipants: number;
  coverImageUrl: string;
  location?: ExperienceLocation;
  availabilityType: ExperienceAvailabilityType;
  allowStandalonePurchase?: boolean;
  allowReservationPurchase?: boolean;
}

export interface Experience extends BaseExperience {
  propertyName?: string;
  tenantId?: string;
  propertyId?: string;
  unitIds?: string[];
  units?: ExperienceUnitSummary[];
  startAt?: string;
  endAt?: string;
  blackoutRanges?: BlackoutRange[];
  recurrence?: ExperienceRecurrence;
  // Public gallery URLs derived server-side from the stored media keys (read-only).
  mediaUrls?: string[];
}

export type PropertyExperience = Experience & { scope: 'PROPERTY' };
export type TenantExperience = Experience & { scope: 'TENANT' };

// Write shape: media travels as keys, never URLs. The cover is mediaKeys[0].
export type CreateExperienceDto = Omit<
  Experience,
  'id' | 'propertyName' | 'units' | 'tenantId' | 'coverImageUrl' | 'mediaUrls'
> & {
  mediaKeys?: string[];
};
export type UpdateExperienceDto = Partial<
  Pick<
    Experience,
    | 'name'
    | 'description'
    | 'propertyId'
    | 'unitIds'
    | 'priceCop'
    | 'durationHours'
    | 'capacity'
    | 'location'
    | 'availabilityType'
    | 'startAt'
    | 'endAt'
    | 'recurrence'
    | 'blackoutRanges'
    | 'allowStandalonePurchase'
    | 'allowReservationPurchase'
  >
> & {
  // Replace-all: send every key to keep (cover first), omitted keys are purged server-side.
  mediaKeys?: string[];
};

export interface ExperiencesResponse {
  data:
    | Experience[]
    | {
        experiences?: Experience[];
        items?: Experience[];
      };
}

export interface ExperienceResponse {
  message?: string;
  data: Experience;
}
