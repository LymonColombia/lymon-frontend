import {
  GuestLoginResponse,
  GuestRegisterResponse,
  GuestVerifyEmailResponse,
  GuestRecoverPasswordResponse,
  GuestConfirmRecoverPasswordResponse,
} from '@/domain/entities/guest-auth.model';

export class GuestAuthMapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toLoginResponse(raw: any): GuestLoginResponse {
    return {
      guestAccountId: raw.data.guestAccountId,
      email: raw.data.email,
      emailVerified: raw.data.emailVerified,
      accessToken: raw.data.accessToken,
      refreshToken: raw.data.refreshToken,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toRegisterResponse(raw: any): GuestRegisterResponse {
    return {
      message: raw.message,
      data: {
        guestAccountId: raw.data.guestAccountId,
        email: raw.data.email,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toVerifyEmailResponse(raw: any): GuestVerifyEmailResponse {
    return { message: raw.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toRecoverPasswordResponse(raw: any): GuestRecoverPasswordResponse {
    return { message: raw.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toConfirmRecoverPasswordResponse(raw: any): GuestConfirmRecoverPasswordResponse {
    return { message: raw.message };
  }
}
