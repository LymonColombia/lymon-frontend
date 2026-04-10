import { inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Observable, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '@env';
import { TokenService } from '@/infrastructure/services/token.service';

const REFRESH_THRESHOLD_SECONDS = 60;
const AUTH_REFRESH_PATH = `${environment.auth.endpoint}/refresh`;

interface RefreshResponse {
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

let refreshInFlight$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const http = inject(HttpClient);
  const accessToken = tokenService.getAccessToken();

  if (!accessToken || isRefreshRequest(req.url) || req.headers.has('Authorization')) {
    return next(req);
  }

  if (!isTokenExpiringSoon(accessToken, REFRESH_THRESHOLD_SECONDS)) {
    return next(addAuthorizationHeader(req, accessToken));
  }

  return refreshAccessToken(http, tokenService).pipe(
    switchMap((updatedAccessToken) => next(addAuthorizationHeader(req, updatedAccessToken))),
  );
};

function addAuthorizationHeader(req: Parameters<HttpInterceptorFn>[0], accessToken: string) {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` },
  });
}

function refreshAccessToken(http: HttpClient, tokenService: TokenService): Observable<string> {
  if (refreshInFlight$) {
    return refreshInFlight$;
  }

  const currentRefreshToken = tokenService.getRefreshToken();

  if (!currentRefreshToken) {
    return throwError(() => new Error('Refresh token is missing'));
  }

  const refreshUrl = `${environment.apiUrl}${AUTH_REFRESH_PATH}`;

  refreshInFlight$ = http.post<RefreshResponse>(refreshUrl, { refreshToken: currentRefreshToken }).pipe(
    map((response) => {
      const nextAccessToken = response.data?.accessToken ?? response.accessToken;
      const nextRefreshToken = response.data?.refreshToken ?? response.refreshToken;

      if (!nextAccessToken) {
        throw new Error('Refresh response did not include accessToken');
      }

      tokenService.store({
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken ?? currentRefreshToken,
      });

      return nextAccessToken;
    }),
    finalize(() => {
      refreshInFlight$ = null;
    }),
    shareReplay(1),
  );

  return refreshInFlight$;
}

function isRefreshRequest(url: string): boolean {
  return url.includes(AUTH_REFRESH_PATH);
}

function isTokenExpiringSoon(token: string, thresholdSeconds: number): boolean {
  const payload = getJwtPayload(token);

  if (!payload?.exp || typeof payload.exp !== 'number') {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - nowInSeconds <= thresholdSeconds;
}

function getJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = decodeBase64Url(parts[1]);
    const parsed: unknown = JSON.parse(payload);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed as { exp?: number };
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(normalized + padding);
}
