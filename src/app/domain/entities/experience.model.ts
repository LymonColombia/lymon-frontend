export interface Experience {
  id: string;
  tenantId?: string;
  scope: ExperienceScope;
  propertyId?: string;
  name: string;
  description?: string;
  city: string;
  category: ExperienceCategory;
  priceCop: number;
  minimumParticipants: number;
  capacity: number;
  availabilityType: ExperienceAvailabilityType;
  recurrence: ExperienceRecurrence;
  minNoticeHours?: number;
  purchaseCutoffHours?: number;
  allowStandalonePurchase: true;
  allowReservationPurchase: true;
  // Public gallery URLs derived server-side from the stored media keys (read-only).
  mediaUrls?: string[];
  propertyName?: string;
  units?: string[];
}


export type ExperienceAvailabilityType = 'RECURRING';
export type ExperienceScope = 'GLOBAL' | 'PROPERTY';
export type ExperienceCategory = 'TRANSPORTATION';

export interface ExperienceRecurrence {
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
}

export interface CreateExperienceDto {
  scope: ExperienceScope;
  propertyId?: string;
  name: string;
  description?: string;
  city: string;
  category: ExperienceCategory;
  priceCop: number;
  minimumParticipants: number;
  capacity: number;
  availabilityType: ExperienceAvailabilityType;
  recurrence: ExperienceRecurrence;
  allowStandalonePurchase: true;
  allowReservationPurchase: true;
  mediaKeys?: string[];

}

// Update = Create sin category. Una sola fuente de verdad.
export type UpdateExperienceDto = Omit<CreateExperienceDto, 'category'>;

export interface ExperienceResponse {
  message?: string;
  data: Experience;
}

export interface ExperiencePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExperienceListData {
  experiences: Experience[];
  pagination: ExperiencePagination;
}

export interface ExperiencesResponse {
  message?: string;
  data: ExperienceListData;
}
