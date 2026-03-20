export type CrmGuestStatus = 'active' | 'inactive';
export type CrmGuestBookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';
export type CrmGuestBookingSource = 'MANUAL' | 'DIRECT' | 'AIRBNB' | 'BOOKING' | 'VRBO';

export interface CrmGuest {
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: CrmGuestStatus;
  tags?: string[];
}

export interface GetCrmGuestsResponse {
  data: CrmGuest[];
}

export interface CrmGuestBooking {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  status: CrmGuestBookingStatus;
  totalAmount: number;
  source: CrmGuestBookingSource;
  createdAt: string;
}

export interface GetCrmGuestBookingsResponse {
  data: CrmGuestBooking[];
}
