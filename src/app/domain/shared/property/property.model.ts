export type PropertyType =
  | 'HOTEL'
  | 'CASA'
  | 'APARTAMENTO'
  | 'VILLA'
  | 'HOSTAL'
  | 'GLAMPING'
  | 'RURAL'
  | 'CASA_DE_CAMPO'
  | 'FINCA'
  | 'APARTAHOTEL';

export type CancellationPolicy = 'FLEXIBLE' | 'STANDARD' | 'STRICT';

export type BedType = 'SINGLE' | 'DOUBLE' | 'QUEEN' | 'KING' | 'SOFA_BED';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface BedDto {
  type: BedType;
  count: number;
}

export interface BedroomDto {
  roomName: string;
  beds: BedDto[];
}

export interface CreatePropertyDto {
  name: string;
  description: string;
  propertyType: PropertyType;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  location: LocationCoordinates;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
  hostPhone: string;
  hostEmail: string;
}

export type UpdatePropertyDto = CreatePropertyDto;

export interface PropertyDetail {
  id: string;
  name: string;
  description: string;
  propertyType: PropertyType;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  location: LocationCoordinates;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
  hostPhone: string;
  hostEmail: string;
}

export interface UpdateUnitMediaKeysDto {
  mediaKeys: string[];
}

export interface CreateUnitDto {
  propertyId: string;
  name: string;
  description: string;
  inventoryCount: number;
  maxGuests: number;
  standardGuests: number;
  bedrooms: BedroomDto[];
  bathroomsCount: number;
  isShared: boolean;
  amenities: string[];
  pricePerNight: number;
  externalIds?: {
    airbnbId?: string;
    bookingId?: string;
    vrboId?: string;
  };
}

export type UpdateUnitDto = Omit<CreateUnitDto, 'propertyId'>;

export interface Property {
  id: string;
  name: string;
  propertyType: string;
  city: string;
}

export interface PropertiesResponse {
  data: Property[];
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  propertyId?: string;
  maxGuests?: number;
  standardGuests?: number;
  bedrooms?: Bedroom[];
  inventoryCount?: number;
  pricePerNight?: number;
  isShared?: boolean;
  amenities?: string[];
  bathroomsCount?: number;
  rating?: number | null;
  // Public gallery URLs derived server-side from the stored media keys (read-only).
  mediaUrls?: string[];
  externalIds?: {
    airbnbId?: string;
    bookingId?: string;
    vrboId?: string;
  };
}

export interface Bedroom {
  roomName: string;
  beds: Bed[];
}

export interface Bed {
  type: string;
  count: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicUnitsParams {
  page: number;
  limit: number;
  name?: string;
  startDate?: string;
  endDate?: string;
  minGuests?: number;
  propertyId?: string;
}

export interface UnitsResponse {
  data: {
    units: Unit[];
    pagination?: Pagination;
  };
}

export interface UnitResponse {
  data: {
    unit: Unit;
  };
}

export interface UnitRating {
  id: string;
  unitId: string;
  guestId: string;
  reservationId: string;
  rate: number;
  message: string;
  createdAt: string;
  guestName: string;
}

export interface UnitRatingsResponse {
  ratings: UnitRating[];
  total: number;
  page: number;
  limit: number;
}

export interface GetUnitRatingsParams {
  unitId: string;
  page: number;
  limit: number;
  sort?: 'best' | 'worst';
  filterRate?: number;
}
