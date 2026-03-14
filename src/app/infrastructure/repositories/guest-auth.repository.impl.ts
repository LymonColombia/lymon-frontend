import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GuestAuthRepository } from '@/domain/repositories/guest-auth.repository';
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
import { GuestAuthMapper } from '@/infrastructure/mappers/guest-auth.mapper';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.guestAuth.endpoint}`;

@Injectable({ providedIn: 'root' })
export class GuestAuthRepositoryImpl extends GuestAuthRepository {
  private readonly http = inject(HttpClient);

  login(credentials: GuestLoginRequest): Observable<GuestLoginResponse> {
    return this.http
      .post<unknown>(`${BASE_URL}/login`, credentials)
      .pipe(map((res) => GuestAuthMapper.toLoginResponse(res)));
  }

  register(data: GuestRegisterRequest): Observable<GuestRegisterResponse> {
    return this.http
      .post<unknown>(`${BASE_URL}/register`, data)
      .pipe(map((res) => GuestAuthMapper.toRegisterResponse(res)));
  }

  verifyEmail(token: string): Observable<GuestVerifyEmailResponse> {
    return this.http
      .get<unknown>(`${BASE_URL}/verify-email`, { params: { token } })
      .pipe(map((res) => GuestAuthMapper.toVerifyEmailResponse(res)));
  }

  recoverPassword(data: GuestRecoverPasswordRequest): Observable<GuestRecoverPasswordResponse> {
    return this.http
      .post<unknown>(`${BASE_URL}/recover-password`, data)
      .pipe(map((res) => GuestAuthMapper.toRecoverPasswordResponse(res)));
  }

  confirmRecoverPassword(
    data: GuestConfirmRecoverPasswordRequest,
  ): Observable<GuestConfirmRecoverPasswordResponse> {
    return this.http
      .post<unknown>(`${BASE_URL}/confirm-recover-password`, data)
      .pipe(map((res) => GuestAuthMapper.toConfirmRecoverPasswordResponse(res)));
  }
}
