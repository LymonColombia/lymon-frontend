import { GuestSessionTokens } from '@/domain/guest/guest-auth/guest-auth.model';

/** Port for persisting the guest session. See AuthSessionRepository. */
export abstract class GuestSessionRepository {
  abstract storeTokens(tokens: GuestSessionTokens): void;
}
