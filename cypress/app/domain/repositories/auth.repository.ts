import { Observable } from 'rxjs';
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

export abstract class AuthRepository {
  abstract login(credentials: LoginRequest): Observable<LoginResponse>;
  abstract register(data: RegisterRequest): Observable<RegisterResponse>;
  abstract recoverPassword(data: RecoverPasswordRequest): Observable<RecoverPasswordResponse>;
  abstract confirmRecoverPassword(data: ConfirmRecoverPasswordRequest): Observable<ConfirmRecoverPasswordResponse>;
}
