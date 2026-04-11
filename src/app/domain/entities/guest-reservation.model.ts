export interface GuestReservationRequest {
  tenantId: string;
  propertyId: string;
  unitId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  notes?: string;
}

export interface GuestReservationResponse {
  id: string;
  bookingReference: string;
  propertyId: string;
  propertyName?: string;
  unitId: string;
  unitName?: string;
  serviceName?: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  guestsCount: number;
  notes?: string | null;
  source?: string;
  priceBreakdown?: {
    pricePerNight: number;
    nights: number;
    totalPrice: number;
  };
}

export interface GuestReservationsPage {
  reservations: GuestReservationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
