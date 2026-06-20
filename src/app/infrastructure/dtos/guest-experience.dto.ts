export interface GuestExperienceLocationDto {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface GuestExperienceDto {
  id: string;
  tenantId?: string;
  scope: string;
  propertyId: string | null;
  name: string;
  description: string;
  category: string;
  priceCop: number;
  durationHours: number;
  capacity: number;
  coverImageUrl: string;
  location: GuestExperienceLocationDto;
  availabilityType: string;
  startAt: string | null;
  endAt: string | null;
  recurrence: unknown;
  blackoutRanges: unknown[];
  allowStandalonePurchase: boolean;
  allowReservationPurchase: boolean;
  minNoticeHours: number;
  purchaseCutoffHours: number;
}

export interface GuestExperiencePageDto {
  experiences: GuestExperienceDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
