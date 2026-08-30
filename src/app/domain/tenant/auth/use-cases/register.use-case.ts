import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthRepository } from '@/domain/tenant/auth/auth.repository';
import { AuthSessionRepository } from '@/domain/tenant/auth-session/auth-session.repository';
import { RegisterRequest, RegisterResponse } from '@/domain/tenant/auth/auth.model';

@Injectable({ providedIn: 'root' })
export class RegisterUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly session = inject(AuthSessionRepository);

  execute(data: RegisterRequest): Observable<RegisterResponse> {
    return this.authRepository
      .register(data)
      .pipe(tap((response) => this.session.storeTokens(response.tokens)));
  }
}
