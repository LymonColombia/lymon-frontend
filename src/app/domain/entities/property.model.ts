export type PropertyType = 'HOTEL' | 'CASA' | 'APARTAMENTO' | 'VILLA' | 'HOSTAL' | 'GLAMPING';

export type CancellationPolicy = 'FLEXIBLE' | 'STANDARD' | 'STRICT';

export type BedType = 'SINGLE' | 'DOUBLE' | 'QUEEN' | 'KING' | 'TWIN' | 'BUNK';

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
  location: { lat: number; lng: number };
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
  hostPhone: string;
  hostEmail: string;
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
