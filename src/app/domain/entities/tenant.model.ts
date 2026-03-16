export interface TenantProfile {
  name: string;
  email?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

export interface TenantProfileResponse {
  data: TenantProfile;
}

export interface UpdateTenantProfileRequest {
  name?: string;
  contactPhone?: string | null;
  address?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

export interface UpdateTenantProfileResponse {
  message: string;
  data: TenantProfile;
}
