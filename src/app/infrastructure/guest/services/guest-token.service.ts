import { Injectable, signal } from '@angular/core';

const GUEST_ACCESS_TOKEN_KEY = 'lymon_guest_access_token';
const GUEST_REFRESH_TOKEN_KEY = 'lymon_guest_refresh_token';
const GUEST_EMAIL_VERIFIED_KEY = 'lymon_guest_email_verified';

interface GuestTokenPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

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

  getGuestEmail(): string | null {
    const payload = this.decodeTokenPayload();
    return typeof payload?.email === 'string' ? payload.email : null;
  }

  getGuestProfile(): {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
  } {
    const payload = this.decodeTokenPayload();
    return {
      email: typeof payload?.email === 'string' ? payload.email : null,
      firstName: typeof payload?.firstName === 'string' ? payload.firstName : null,
      lastName: typeof payload?.lastName === 'string' ? payload.lastName : null,
      fullName: typeof payload?.fullName === 'string' ? payload.fullName : null,
    };
  }

  private decodeTokenPayload(): GuestTokenPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])) as GuestTokenPayload;
    } catch {
      return null;
    }
  }

  private hasStoredToken(): boolean {
    return !!localStorage.getItem(GUEST_ACCESS_TOKEN_KEY);
  }
}
