import { Injectable, signal } from '@angular/core';
import { AuthTokens } from '@/domain/entities/auth.model';

const ACCESS_TOKEN_KEY = 'lymon_access_token';
const REFRESH_TOKEN_KEY = 'lymon_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _isAuthenticated = signal(this.hasStoredToken());
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  store(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    this._isAuthenticated.set(true);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._isAuthenticated.set(false);
  }

  private hasStoredToken(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }
}
