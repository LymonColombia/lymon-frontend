import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRepository } from '@/domain/repositories/auth.repository';
import { LoginRequest, LoginResponse } from '@/domain/entities/auth.model';
import { TokenService } from '@/infrastructure/services/token.service';

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
