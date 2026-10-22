export interface CreateTenantGuestIdentity {
  documentNumber: string;
}

export interface CreateTenantGuestRequest {
  fullName: string;
  primaryEmail: string;
  identity: CreateTenantGuestIdentity | null;
  firstName: string;
  lastName: string;
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
  idNumber?: string;
}

export interface GetTenantGuestsResponse {
  data: TenantGuest[];
}

export interface FindTenantGuestByIdNumberParams {
  idNumber: string;
}
