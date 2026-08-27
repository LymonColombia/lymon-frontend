import { AuthTokens, AuthUser } from '@/domain/entities/auth.model';

/**
 * Port for persisting the tenant session. Auth use-cases depend on this
 * contract, not on the concrete storage services in infrastructure.
 */
export abstract class AuthSessionRepository {
  abstract storeTokens(tokens: AuthTokens): void;
  abstract setUser(user: AuthUser): void;
}
