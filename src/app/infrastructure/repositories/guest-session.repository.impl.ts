import { Injectable, inject } from '@angular/core';
import { GuestSessionRepository } from '@/domain/guest/guest-session/guest-session.repository';
import { GuestSessionTokens } from '@/domain/guest/guest-auth/guest-auth.model';
import { GuestTokenService } from '@/infrastructure/services/guest-token.service';

/** Adapts GuestTokenService, which already owns this state, to the domain port. */
@Injectable({ providedIn: 'root' })
export class GuestSessionRepositoryImpl extends GuestSessionRepository {
  private readonly guestTokenService = inject(GuestTokenService);

  storeTokens(tokens: GuestSessionTokens): void {
    this.guestTokenService.store(tokens);
  }
}
