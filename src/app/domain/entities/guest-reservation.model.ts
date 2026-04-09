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
  status: string;
  unitId: string;
  unitName?: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  guestsCount: number;
  pricePerNight?: number;
  totalPrice?: number;
  notes?: string | null;
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
