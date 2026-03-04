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
}

export interface UnitsResponse {
  data: {
    units: Unit[];
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
