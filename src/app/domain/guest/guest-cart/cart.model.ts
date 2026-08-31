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
  notes?: string;
  pricePerNight: number;
  totalPriceCop: number;
  reservationId: string | null;
}

export interface CartExperienceItem {
  experienceId: string;
  experienceName?: string;
  quantity: number;
  selectedDate: string;
  unitPriceCop?: number;
  totalPriceCop: number;
  reservationId?: string | null;
}

export interface Cart {
  cartId: string;
  status: 'OPEN' | 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED';
  reservationItem: CartReservationItem | null;
  experienceItems: CartExperienceItem[];
  totalCop: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartCheckoutResponse {
  status: string;
  message?: string;
}
