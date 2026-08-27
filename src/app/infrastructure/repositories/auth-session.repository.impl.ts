import { Injectable, inject } from '@angular/core';
import { AuthSessionRepository } from '@/domain/repositories/auth-session.repository';
import { AuthTokens, AuthUser } from '@/domain/entities/auth.model';
import { TokenService } from '@/infrastructure/services/token.service';
import { UserSessionService } from '@/infrastructure/services/user-session.service';

/** Adapts the two session services that already own this state to the domain port. */
@Injectable({ providedIn: 'root' })
export class AuthSessionRepositoryImpl extends AuthSessionRepository {
  private readonly tokenService = inject(TokenService);
  private readonly userSessionService = inject(UserSessionService);

  storeTokens(tokens: AuthTokens): void {
    this.tokenService.store(tokens);
  }

  setUser(user: AuthUser): void {
    this.userSessionService.setUser(user);
  }
}
