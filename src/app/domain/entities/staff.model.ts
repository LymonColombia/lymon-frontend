export type ScopeType = 'TENANT' | 'PROPERTY' | 'UNIT';

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
    type: ScopeType;
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
