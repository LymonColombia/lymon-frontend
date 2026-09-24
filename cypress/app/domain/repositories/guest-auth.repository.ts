import { Observable } from 'rxjs';
import {
  GuestLoginRequest,
  GuestLoginResponse,
  GuestRegisterRequest,
  GuestRegisterResponse,
  GuestVerifyEmailResponse,
  GuestRecoverPasswordRequest,
  GuestRecoverPasswordResponse,
  GuestConfirmRecoverPasswordRequest,
  GuestConfirmRecoverPasswordResponse,
} from '@/domain/entities/guest-auth.model';

export abstract class GuestAuthRepository {
  abstract login(credentials: GuestLoginRequest): Observable<GuestLoginResponse>;
  abstract register(data: GuestRegisterRequest): Observable<GuestRegisterResponse>;
  abstract verifyEmail(token: string): Observable<GuestVerifyEmailResponse>;
  abstract recoverPassword(
    data: GuestRecoverPasswordRequest,
  ): Observable<GuestRecoverPasswordResponse>;
  abstract confirmRecoverPassword(
    data: GuestConfirmRecoverPasswordRequest,
  ): Observable<GuestConfirmRecoverPasswordResponse>;
}
