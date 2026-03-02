import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthRepository } from '../../core/repositories/auth.repository';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../../core/domain/auth.model';
import { AuthMapper } from '../mappers/auth.mapper';

const BASE_URL = 'http://localhost:3000/auth';

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
}
