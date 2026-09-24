import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthRepository } from '@/domain/tenant/auth/auth.repository';
import { AuthSessionRepository } from '@/domain/tenant/auth-session/auth-session.repository';
import { LoginRequest, LoginResponse } from '@/domain/tenant/auth/auth.model';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly session = inject(AuthSessionRepository);

  execute(credentials: LoginRequest): Observable<LoginResponse> {
    return this.authRepository.login(credentials).pipe(
      tap((response) => {
        this.session.storeTokens(response.tokens);
        this.session.setUser(response.user);
      }),
    );
  }
}
