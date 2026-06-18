export interface CreateTenantGuestRequest {
  fullName: string;
  primaryEmail: string;
  identity: null;
  firstName: string;
  lastName: string;
  emails: never[];
  phones: never[];
  tags: never[];
  preferences: never[];
}

export interface CreateTenantGuestResponse {
  guestId: string;
  fullName: string;
  primaryEmail: string;
}

export interface TenantGuest {
  id: string;
  fullName?: string;
  name?: string;
  primaryEmail?: string;
  email?: string;
}

export interface GetTenantGuestsResponse {
  data: TenantGuest[];
}
