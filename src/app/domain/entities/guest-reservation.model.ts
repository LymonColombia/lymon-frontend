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
  tenantId?: string;
  propertyId: string;
  propertyName?: string;
  unitId: string;
  unitName?: string;
  guestId?: string;
  serviceName?: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  guestsCount: number;
  pricePerNight?: number;
  totalPrice?: number;
  notes?: string | null;
  source?: string;
  externalReservationId?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  checkInActualAt?: string | null;
  checkOutActualAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  priceBreakdown?: {
    pricePerNight: number;
    nights: number;
    totalPrice: number;
  };
}

export interface GetGuestReservationsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'pending' | 'confirmed' | 'finished' | 'cancelled';
  sortBy?: 'date' | 'status' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  fromDate?: string;
  toDate?: string;
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
