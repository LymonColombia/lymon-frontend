import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginRequest, LoginResponse } from '../domain/auth.model';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly tokenService = inject(TokenService);

  execute(credentials: LoginRequest): Observable<LoginResponse> {
    return this.authRepository
      .login(credentials)
      .pipe(tap((response) => this.tokenService.store(response.tokens)));
  }
}
