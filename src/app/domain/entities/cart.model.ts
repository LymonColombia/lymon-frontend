export interface CartReservationDraftRequest {
  tenantId: string;
  propertyId: string;
  unitId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  pricePerNight: number;
  notes?: string;
}

export interface CartExperienceItemRequest {
  tenantId: string;
  experienceId: string;
  quantity: number;
  selectedDate: string;
  reservationId: string | null;
}

export interface CartReservationItem {
  propertyId: string;
  unitId: string;
  unitName?: string;
  propertyName?: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  pricePerNight: number;
  totalPriceCop: number;
  reservationId: string | null;
}

export interface CartExperienceItem {
  experienceId: string;
  name?: string;
  quantity: number;
  selectedDate: string;
  priceCop: number;
  totalPriceCop: number;
}

export interface Cart {
  status: 'OPEN' | 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED';
  reservationItem: CartReservationItem | null;
  experienceItems: CartExperienceItem[];
  totalCop: number;
}

export interface CartCheckoutResponse {
  status: string;
  message?: string;
}
