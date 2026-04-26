export type CrmGuestStatus = 'active' | 'inactive';
export type CrmGuestSortBy = 'createdAt' | 'fullName' | 'status';
export type CrmGuestSortDirection = 'asc' | 'desc';

export interface GetCrmGuestsParams {
  sortBy?: CrmGuestSortBy;
  sortDirection?: CrmGuestSortDirection;
}
export type CrmGuestBookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';
export type CrmGuestBookingSource = 'MANUAL' | 'DIRECT' | 'AIRBNB' | 'BOOKING' | 'VRBO';
export type CrmGuestNoteCategory = 'preference' | 'behavior' | 'incident' | 'general';
export type CrmGuestNoteStatus = 'pinned' | 'not_pinned';

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

export interface CreateCrmGuestNoteRequest {
  note: string;
  type: CrmGuestNoteCategory;
  status: CrmGuestNoteStatus;
}

export interface UpdateCrmGuestNoteRequest {
  note: string;
  type: CrmGuestNoteCategory;
}

export interface CrmGuestNote {
  id: string;
  note: string;
  type: CrmGuestNoteCategory;
  status: CrmGuestNoteStatus;
  createdAt: string;
  createdByName: string;
}

export interface GetCrmGuestNotesResponse {
  data: CrmGuestNote[];
}

export type CrmGuestMessageTemplateId = 'GUEST_WELCOME' | 'guest-message';

export interface CrmGuestMessageAttachment {
  url: string;
  name: string;
  type: string;
}

export interface SendCrmGuestMessageRequest {
  subject: string;
  body: string;
  templateId: CrmGuestMessageTemplateId;
  attachments: CrmGuestMessageAttachment[];
}

export interface CrmGuestEmail {
  id: string;
  subject: string;
  status: string;
  sentById: string;
  createdAt: string;
}

export interface GetCrmGuestEmailsResponse {
  data: CrmGuestEmail[];
}
