

export interface ResponseGetById{
  data: GuestExperience
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


export interface ExperienceLocation {
  label: string;
  address: string;
  lat: number;
  lng: number;
}


export type AvailabilityType = "RECURRING" | "DATE_RANGE" | "ONE_TIME";


export type ExperienceScope = "PROPERTY" | "TENANT";

export interface GuestExperience {
  id: string;
  tenantId?: string;
  scope: ExperienceScope;
  propertyId: string | null;        
  name: string;
  description: string;
  category: string;                 
  priceCop: number;
  durationHours: number;
  capacity: number;
  coverImageUrl: string;
  location: ExperienceLocation;
  availabilityType: AvailabilityType;
  startAt: string | null;           
  endAt: string | null;             
  recurrence: ExperienceRecurrence | null; 
  blackoutRanges: BlackoutRange[];
  allowStandalonePurchase: boolean;
  allowReservationPurchase: boolean;
  minNoticeHours: number;
  purchaseCutoffHours: number;
}

export interface GuestExperiencePage {
  experiences: GuestExperience[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
