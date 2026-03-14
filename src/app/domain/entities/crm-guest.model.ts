export type CrmGuestStatus = 'active' | 'inactive';

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
