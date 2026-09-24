export type PlanType = 'TRIAL' | 'LYMON_ONE' | 'PLUS' | 'PRIME';

export type UserRole = 'ADMIN' | 'STAFF';

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
  planType?: PlanType;
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

export interface RecoverPasswordRequest {
  email: string;
}

export interface RecoverPasswordResponse {
  message: string;
}

export interface ConfirmRecoverPasswordRequest {
  token: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface ConfirmRecoverPasswordResponse {
  message: string;
}
