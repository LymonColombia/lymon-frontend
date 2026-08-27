import { GuestSessionTokens } from '@/domain/entities/guest-auth.model';

/** Port for persisting the guest session. See AuthSessionRepository. */
export abstract class GuestSessionRepository {
  abstract storeTokens(tokens: GuestSessionTokens): void;
}
