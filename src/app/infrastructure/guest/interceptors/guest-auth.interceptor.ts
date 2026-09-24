import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '@env';
import { GuestTokenService } from '@/infrastructure/guest/services/guest-token.service';

const REFRESH_THRESHOLD_SECONDS = 60;
const GUEST_AUTH_BASE = `${environment.apiUrl}${environment.guestAuth.endpoint}`;
const GUEST_REFRESH_URL = `${GUEST_AUTH_BASE}/refresh`;

interface GuestRefreshResponse {
  data?: { accessToken?: string; refreshToken?: string };
  accessToken?: string;
  refreshToken?: string;
}

let guestRefreshInFlight$: Observable<string> | null = null;

export const guestAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isGuestProtectedRequest(req.url)) {
    return next(req);
  }

  const guestTokenService = inject(GuestTokenService);
  const http = inject(HttpClient);
  const router = inject(Router);

  const accessToken = guestTokenService.getAccessToken();
  if (!accessToken) return next(req);

  if (isTokenExpiringSoon(accessToken, REFRESH_THRESHOLD_SECONDS)) {
    const refreshToken = guestTokenService.getRefreshToken();
    if (!refreshToken || isTokenExpired(refreshToken)) {
      guestTokenService.clear();
      router.navigate(['/guest/login'], { queryParams: { sessionExpired: true } });
      return throwError(() => new Error('Guest session expired'));
    }

    return refreshGuestToken(http, guestTokenService).pipe(
      switchMap((newToken) => next(withToken(req, newToken))),
      catchError(() => {
        guestTokenService.clear();
        router.navigate(['/guest/login'], { queryParams: { sessionExpired: true } });
        return throwError(() => new Error('Guest session expired'));
      }),
    );
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = guestTokenService.getRefreshToken();
      if (!refreshToken || isTokenExpired(refreshToken)) {
        guestTokenService.clear();
        router.navigate(['/guest/login'], { queryParams: { sessionExpired: true } });
        return throwError(() => error);
      }

      return refreshGuestToken(http, guestTokenService).pipe(
        switchMap((newToken) => next(withToken(req, newToken))),
        catchError(() => {
          guestTokenService.clear();
          router.navigate(['/guest/login'], { queryParams: { sessionExpired: true } });
          return throwError(() => error);
        }),
      );
    }),
  );
};

function isGuestProtectedRequest(url: string): boolean {
  return (
    url.startsWith(`${environment.apiUrl}/guest/`) &&
    !url.includes('/guest/auth/')
  );
}

function withToken(
  req: Parameters<HttpInterceptorFn>[0],
  token: string,
): ReturnType<typeof req.clone> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function refreshGuestToken(
  http: HttpClient,
  guestTokenService: GuestTokenService,
): Observable<string> {
  if (guestRefreshInFlight$) return guestRefreshInFlight$;

  const refreshToken = guestTokenService.getRefreshToken();
  if (!refreshToken) {
    return throwError(() => new Error('Guest refresh token missing'));
  }

  guestRefreshInFlight$ = http
    .post<GuestRefreshResponse>(GUEST_REFRESH_URL, { refreshToken })
    .pipe(
      map((res) => {
        const newAccess = res.data?.accessToken ?? res.accessToken;
        const newRefresh = res.data?.refreshToken ?? res.refreshToken;

        if (!newAccess) {
          throw new Error('Guest refresh response did not include accessToken');
        }

        guestTokenService.store({
          accessToken: newAccess,
          refreshToken: newRefresh ?? refreshToken,
        });

        return newAccess;
      }),
      finalize(() => {
        guestRefreshInFlight$ = null;
      }),
      shareReplay(1),
    );

  return guestRefreshInFlight$;
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const normalized = parts[1].replaceAll('-', '+').replaceAll('_', '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(normalized + padding)) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

function isTokenExpiringSoon(token: string, thresholdSeconds: number): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;

    const normalized = parts[1].replaceAll('-', '+').replaceAll('_', '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(normalized + padding)) as { exp?: number };

    if (!payload.exp) return true;
    return payload.exp - Math.floor(Date.now() / 1000) <= thresholdSeconds;
  } catch {
    return true;
  }
}
