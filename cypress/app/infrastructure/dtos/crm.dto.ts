export interface PaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponseDto<T> {
  items: T[];
  pagination: PaginationDto;
}

export interface CrmGuestDto {
  guestId: string;
  fullName: string;
  primaryEmail: string;
  phones: Array<{
    number?: string;
    isPrimary?: boolean;
  }>;
  status: string;
  tags: string[];
}

export interface CrmGuestBookingDto {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount: number;
  source: string;
  createdAt: string;
  nights: number;
  guestsCount: number;
  notes: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  checkInActualAt: string | null;
  checkOutActualAt: string | null;
}

export interface CrmGuestNoteDto {
  id: string;
  guestId: string;
  note: string;
  type: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmGuestEmailDto {
  id: string;
  guestId: string;
  subject: string;
  status: string;
  messageId: string;
  attachments: unknown[];
  sentById: string;
  createdAt: string;
}
