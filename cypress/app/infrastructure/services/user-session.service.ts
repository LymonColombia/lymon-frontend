import { Injectable, signal } from '@angular/core';
import { AuthUser } from '@/domain/entities/auth.model';

const USER_KEY = 'lymon_current_user';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly _currentUser = signal<AuthUser | null>(this.loadStoredUser());
  readonly currentUser = this._currentUser.asReadonly();

  setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  clear(): void {
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
  }

  get tenantId(): string | null {
    return this._currentUser()?.tenantId ?? null;
  }

  private loadStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
