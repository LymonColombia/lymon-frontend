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
  coverImageUrl: string;
  location: ExperienceLocation;
  availabilityType: ExperienceAvailabilityType;
  allowStandalonePurchase?: boolean;
  allowReservationPurchase?: boolean;
}

export interface Experience extends BaseExperience {
  propertyName?: string;
  propertyId?: string;
  unitIds?: string[];
  units?: ExperienceUnitSummary[];
  startAt?: string;
  endAt?: string;
  blackoutRanges?: BlackoutRange[];
  recurrence?: ExperienceRecurrence;
}

export type PropertyExperience = Experience & { scope: 'PROPERTY' };
export type TenantExperience = Experience & { scope: 'TENANT' };

export type CreateExperienceDto = Omit<Experience, 'id' | 'propertyName' | 'units'>;
export type UpdateExperienceDto = Partial<
  Pick<
    Experience,
   //| 'scope'
    | 'name'
    | 'description'
    //| 'propertyId'
    //| 'unitIds'
    | 'priceCop'
    | 'durationHours'
    | 'capacity'
    | 'coverImageUrl'
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
  data:
    | Experience
    | {
        experience?: Experience;
      };
}
