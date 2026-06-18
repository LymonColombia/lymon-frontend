export interface CreateShiftDto {
  name: string;
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
  name: string;
  staffMemberIds: string[];
  propertyId: string;
  startDate: string;
  endDate: string;
  startHour: string;
  endHour: string;
  notes?: string;
  createdAt?: string;
}
export interface UpdateShiftDto {
  name?: string;
  propertyId?: string;
  startDate?: string;
  endDate?: string;
  startHour?: string;
  endHour?: string;
  notes?: string;
}
