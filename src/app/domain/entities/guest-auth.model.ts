export interface GuestRegisterRequest {
  fullName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface GuestRegisterResponse {
  message: string;
  data: {
    guestAccountId: string;
    email: string;
  };
}

export interface GuestLoginRequest {
  email: string;
  password: string;
}

export interface GuestLoginResponse {
  guestAccountId: string;
  email: string;
  emailVerified: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface GuestVerifyEmailResponse {
  message: string;
}

export interface GuestRecoverPasswordRequest {
  email: string;
}

export interface GuestRecoverPasswordResponse {
  message: string;
}

export interface GuestConfirmRecoverPasswordRequest {
  token: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface GuestConfirmRecoverPasswordResponse {
  message: string;
}

export interface GuestProfile {
  id: string;
  fullName: string;
  email: string;
}
