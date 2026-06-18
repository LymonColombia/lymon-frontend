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
