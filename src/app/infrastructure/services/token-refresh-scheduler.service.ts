import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { UserSessionService } from './user-session.service';
import { getJwtPayload, refreshAccessToken } from '@/infrastructure/interceptors/auth.interceptor';

const REFRESH_AHEAD_SECONDS = 120;

@Injectable({ providedIn: 'root' })
export class TokenRefreshSchedulerService {
  private readonly tokenService = inject(TokenService);
  private readonly userSessionService = inject(UserSessionService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.tokenService.isAuthenticated()) {
        this.scheduleRefresh();
      } else {
        this.cancelRefresh();
      }
    });

    this.destroyRef.onDestroy(() => this.cancelRefresh());
  }

  private scheduleRefresh(): void {
    this.cancelRefresh();

    const accessToken = this.tokenService.getAccessToken();
    if (!accessToken) return;

    const exp = getJwtPayload(accessToken)?.exp;
    if (!exp) return;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const delaySeconds = exp - nowSeconds - REFRESH_AHEAD_SECONDS;

    if (delaySeconds <= 0) {
      this.doRefresh();
      return;
    }

    this.refreshTimer = setTimeout(() => this.doRefresh(), delaySeconds * 1000);
  }

  private cancelRefresh(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private doRefresh(): void {
    refreshAccessToken(this.http, this.tokenService).subscribe({
      next: () => this.scheduleRefresh(),
      error: () => {
        this.tokenService.clear();
        this.userSessionService.clear();
        this.router.navigate(['/login'], { queryParams: { sessionExpired: true } });
      },
    });
  }
}
