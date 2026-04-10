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
  checkIn?: string;
  checkOut?: string;
  guests?: number;
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

export interface RoleAssignmentDto {
  roleId: string;
  scope: { type: 'TENANT' } | { type: 'PROPERTY' | 'UNIT'; resourceIds: string[] };
}

export interface InviteStaffDto {
  email: string;
  password: string;
  roleAssignments: RoleAssignmentDto[];
}

export interface StaffMember {
  id?: string;
  email: string;
  fullName?: string;
  name?: string;
  role?: 'ADMIN' | 'STAFF';
  createdAt?: string;
  roleAssignments?: RoleAssignmentDto[];
}

export interface StaffListResponse {
  data?: StaffMember[];
  items?: StaffMember[];
  results?: StaffMember[];
  staff?: StaffMember[];
  users?: StaffMember[];
}
