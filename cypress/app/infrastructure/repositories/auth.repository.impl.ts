import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthRepository } from '@/domain/repositories/auth.repository';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RecoverPasswordRequest,
  RecoverPasswordResponse,
  ConfirmRecoverPasswordRequest,
  ConfirmRecoverPasswordResponse,
} from '@/domain/entities/auth.model';
import { AuthMapper } from '@/infrastructure/mappers/auth.mapper';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.auth.endpoint}`;

@Injectable({ providedIn: 'root' })
export class AuthRepositoryImpl extends AuthRepository {
  private readonly http = inject(HttpClient);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<unknown>(`${BASE_URL}/login`, credentials)
      .pipe(map((res) => AuthMapper.toLoginResponse(res)));
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<unknown>(`${BASE_URL}/register`, data)
      .pipe(map((res) => AuthMapper.toRegisterResponse(res)));
  }

  recoverPassword(data: RecoverPasswordRequest): Observable<RecoverPasswordResponse> {
    return this.http
      .post<unknown>(`${BASE_URL}/recover-password`, data)
      .pipe(map((res) => AuthMapper.toRecoverPasswordResponse(res)));
  }

  confirmRecoverPassword(
    data: ConfirmRecoverPasswordRequest,
  ): Observable<ConfirmRecoverPasswordResponse> {
    return this.http
      .post<unknown>(`${BASE_URL}/recover-password/confirm`, data)
      .pipe(map((res) => AuthMapper.toConfirmRecoverPasswordResponse(res)));
  }
}
