import { Observable } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/domain/entities/auth.model';

export abstract class AuthRepository {
  abstract login(credentials: LoginRequest): Observable<LoginResponse>;
  abstract register(data: RegisterRequest): Observable<RegisterResponse>;
}
