export type ScopeType = 'TENANT' | 'PROPERTY' | 'UNIT';

export interface Property {
  id: string;
  name: string;
  propertyType: string;
  city: string;
}

export interface PropertiesResponse {
  data: Property[];
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  propertyId?: string;
  maxGuests?: number;
  standardGuests?: number;
  bedrooms?: Bedroom[];
  inventoryCount?: number;
  pricePerNight?: number;
  isShared?: boolean;
  amenities?: string[];
  bathroomsCount?: number;
  rating?: number | null;
  // Public gallery URLs derived server-side from the stored media keys (read-only).
  mediaUrls?: string[];
  externalIds?: {
    airbnbId?: string;
    bookingId?: string;
    vrboId?: string;
  };
}

export interface Bedroom {
  roomName: string;
  beds: Bed[];
}

export interface Bed {
  type: string;
  count: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicUnitsParams {
  page: number;
  limit: number;
  name?: string;
  startDate?: string;
  endDate?: string;
  minGuests?: number;
  propertyId?: string;
}

export interface UnitsResponse {
  data: {
    units: Unit[];
    pagination?: Pagination;
  };
}

export interface UnitResponse {
  data: {
    unit: Unit;
  };
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface RolesResponse {
  roles: Role[];
}

export interface RoleAssignment {
  roleId: string;
  scope: {
    type: 'TENANT' | 'PROPERTY' | 'UNIT';
    resourceIds?: string[];
    resources?: Array<{ id: string; name: string }>;
  };
}

export interface InviteStaffDto {
  email: string;
  password: string;
  fullName: string;
  document: string;
  roleAssignments: RoleAssignment[];
}

export interface StaffMember {
  id: string;
  email: string;
  isOwner: boolean;
  emailVerified: boolean;
  fullName?: string;
  name?: string;
  role?: 'ADMIN' | 'STAFF';
  createdAt?: string;
  roleAssignments?: RoleAssignment[];
}

export interface StaffListResponse {
  message: string;
  total: number;
  data: StaffMember[];
}

export interface UnitRating {
  id: string;
  unitId: string;
  guestId: string;
  reservationId: string;
  rate: number;
  message: string;
  createdAt: string;
  guestName: string;
}

export interface UnitRatingsResponse {
  ratings: UnitRating[];
  total: number;
  page: number;
  limit: number;
}

export interface GetUnitRatingsParams {
  unitId: string;
  page: number;
  limit: number;
  sort?: 'best' | 'worst';
  filterRate?: number;
}
