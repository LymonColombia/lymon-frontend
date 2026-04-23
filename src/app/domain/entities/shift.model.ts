export interface CreateShiftDto {
  staffMemberIds?: string[];
  propertyId: string;
  startDate: string;
  endDate: string;
  startHour: string;
  endHour: string;
  notes?: string;
}

export interface ShiftResponse {
  id?: string;
  staffMemberIds: string[];
  propertyId: string;
  startDate: string;
  endDate: string;
  startHour: string;
  endHour: string;
  notes?: string;
  createdAt?: string;
}
