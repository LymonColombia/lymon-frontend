export type PlanType = 'LYMON_ONE' | 'PLUS' | 'PRIME' | 'TRIAL';

export type UserRole = 'OWNER' | 'EMPLOYEE';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  tenantName: string;
  email: string;
  password: string;
  planType: PlanType;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  tenantId: string;
  role?: UserRole;
  emailVerified?: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
  tokens: AuthTokens;
}
