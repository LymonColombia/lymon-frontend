import { LoginResponse, RegisterResponse } from '@/domain/entities/auth.model';

export class AuthMapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toLoginResponse(raw: any): LoginResponse {
    return {
      user: {
        userId: raw.data.userId,
        email: raw.data.email,
        tenantId: raw.data.tenantId,
        role: raw.data.role,
        emailVerified: raw.data.emailVerified,
      },
      tokens: {
        accessToken: raw.data.accessToken,
        refreshToken: raw.data.refreshToken,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toRegisterResponse(raw: any): RegisterResponse {
    return {
      message: raw.message,
      user: {
        userId: raw.data.userId,
        email: raw.data.email,
        tenantId: raw.data.tenantId,
      },
      tokens: {
        accessToken: raw.data.accessToken,
        refreshToken: raw.data.refreshToken,
      },
    };
  }
}
