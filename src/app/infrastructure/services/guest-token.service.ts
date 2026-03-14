import { Injectable, signal } from '@angular/core';

const GUEST_ACCESS_TOKEN_KEY = 'lymon_guest_access_token';
const GUEST_REFRESH_TOKEN_KEY = 'lymon_guest_refresh_token';
const GUEST_EMAIL_VERIFIED_KEY = 'lymon_guest_email_verified';

@Injectable({ providedIn: 'root' })
export class GuestTokenService {
  private readonly _isAuthenticated = signal(this.hasStoredToken());
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  store(tokens: { accessToken: string; refreshToken: string; emailVerified?: boolean }): void {
    localStorage.setItem(GUEST_ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(GUEST_REFRESH_TOKEN_KEY, tokens.refreshToken);
    if (tokens.emailVerified !== undefined) {
      localStorage.setItem(GUEST_EMAIL_VERIFIED_KEY, String(tokens.emailVerified));
    }
    this._isAuthenticated.set(true);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(GUEST_ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(GUEST_REFRESH_TOKEN_KEY);
  }

  isEmailVerified(): boolean {
    return localStorage.getItem(GUEST_EMAIL_VERIFIED_KEY) === 'true';
  }

  clear(): void {
    localStorage.removeItem(GUEST_ACCESS_TOKEN_KEY);
    localStorage.removeItem(GUEST_REFRESH_TOKEN_KEY);
    localStorage.removeItem(GUEST_EMAIL_VERIFIED_KEY);
    this._isAuthenticated.set(false);
  }

  private hasStoredToken(): boolean {
    return !!localStorage.getItem(GUEST_ACCESS_TOKEN_KEY);
  }
}
